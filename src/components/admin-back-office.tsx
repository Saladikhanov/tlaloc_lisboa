"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReservationRecord } from "@/lib/types";

type AdminMenuItem = {
  id: string;
  sectionId: string;
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  price: string;
  vegetarian: boolean;
  order: number;
};

type AdminMenuSection = {
  id: string;
  slug: string;
  titleEn: string;
  titlePt: string;
  subtitleEn: string | null;
  subtitlePt: string | null;
  order: number;
  items: AdminMenuItem[];
};

type TabId = "reservations" | "menu" | "security";

export default function AdminBackOffice() {
  const [activeTab, setActiveTab] = useState<TabId>("reservations");
  const [isMenuEditMode, setIsMenuEditMode] = useState(false);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [menuSections, setMenuSections] = useState<AdminMenuSection[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const [newSection, setNewSection] = useState({
    slug: "",
    titleEn: "",
    titlePt: "",
    subtitleEn: "",
    subtitlePt: "",
  });

  const [newItem, setNewItem] = useState({
    sectionId: "",
    nameEn: "",
    namePt: "",
    descriptionEn: "",
    descriptionPt: "",
    price: "",
    vegetarian: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    username: "admin",
    currentPassword: "",
    nextPassword: "",
  });

  const sortedSections = useMemo(
    () => [...menuSections].sort((a, b) => a.order - b.order),
    [menuSections],
  );

  const loadAll = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setStatusMessage("");
    try {
      const [reservationResponse, menuResponse] = await Promise.all([
        fetch("/api/reservations", { cache: "no-store" }),
        fetch("/api/admin/menu", { cache: "no-store" }),
      ]);

      const reservationJson = (await reservationResponse.json()) as { data?: ReservationRecord[] };
      const menuJson = (await menuResponse.json()) as { data?: AdminMenuSection[] };

      setReservations(reservationJson.data ?? []);
      setMenuSections(menuJson.data ?? []);
      setNewItem((prev) =>
        prev.sectionId || !menuJson.data?.[0]?.id
          ? prev
          : { ...prev, sectionId: menuJson.data[0].id },
      );
    } catch {
      setStatusMessage("Could not load back office data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAll(true);
  }, [loadAll]);

  async function runAction(key: string, action: () => Promise<void>) {
    setActionKey(key);
    try {
      await action();
    } finally {
      setActionKey(null);
    }
  }

  async function changeReservationStatus(id: string, status: ReservationRecord["status"]) {
    await runAction(`reservation-${id}-${status}`, async () => {
      const response = await fetch(`/api/admin/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        setStatusMessage("Could not update reservation status.");
        return;
      }

      await loadAll();
    });
  }

  async function createSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction("create-section", async () => {
      const response = await fetch("/api/admin/menu/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSection),
      });

      if (!response.ok) {
        setStatusMessage("Could not create section.");
        return;
      }

      setNewSection({ slug: "", titleEn: "", titlePt: "", subtitleEn: "", subtitlePt: "" });
      await loadAll();
    });
  }

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction("create-item", async () => {
      const response = await fetch("/api/admin/menu/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        setStatusMessage("Could not create item.");
        return;
      }

      setNewItem((prev) => ({
        ...prev,
        nameEn: "",
        namePt: "",
        descriptionEn: "",
        descriptionPt: "",
        price: "",
        vegetarian: false,
      }));
      await loadAll();
    });
  }

  async function saveSection(section: AdminMenuSection) {
    await runAction(`save-section-${section.id}`, async () => {
      const response = await fetch(`/api/admin/menu/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section),
      });

      if (!response.ok) {
        setStatusMessage("Could not update section.");
        return;
      }
      await loadAll();
    });
  }

  async function deleteSection(id: string) {
    await runAction(`delete-section-${id}`, async () => {
      const response = await fetch(`/api/admin/menu/sections/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setStatusMessage("Could not delete section.");
        return;
      }
      await loadAll();
    });
  }

  async function saveItem(item: AdminMenuItem) {
    await runAction(`save-item-${item.id}`, async () => {
      const response = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        setStatusMessage("Could not update item.");
        return;
      }

      await loadAll();
    });
  }

  async function deleteItem(id: string) {
    await runAction(`delete-item-${id}`, async () => {
      const response = await fetch(`/api/admin/menu/items/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setStatusMessage("Could not delete item.");
        return;
      }
      await loadAll();
    });
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction("update-password", async () => {
      const response = await fetch("/api/admin/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatusMessage(json.error ?? "Could not update password.");
        return;
      }

      setPasswordForm((prev) => ({ ...prev, currentPassword: "", nextPassword: "" }));
      setStatusMessage("Password updated.");
    });
  }

  return (
    <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          className={`btn ${activeTab === "reservations" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("reservations")}
          type="button"
        >
          Reservations
        </button>
        <button
          className={`btn ${activeTab === "menu" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("menu")}
          type="button"
        >
          Menu Configuration
        </button>
        <button
          className={`btn ${activeTab === "security" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("security")}
          type="button"
        >
          Security
        </button>
      </div>

      {statusMessage ? <p className="footer-note">{statusMessage}</p> : null}
      {isLoading ? <p className="footer-note db-loader">Loading data...</p> : null}
      {isRefreshing ? <p className="footer-note db-loader">Syncing with database...</p> : null}

      {activeTab === "reservations" ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {reservations.length === 0 ? (
            <div className="card">No reservations yet.</div>
          ) : (
            reservations.map((reservation) => (
              <article className="card" key={reservation.id}>
                <strong>
                  {reservation.firstName} {reservation.lastName}
                </strong>
                <p>
                  {reservation.date} at {reservation.time} · Guests: {reservation.guests}
                </p>
                <p>{reservation.email}</p>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={actionKey !== null}
                    onClick={() => changeReservationStatus(reservation.id, "new")}
                  >
                    {actionKey === `reservation-${reservation.id}-new` ? "Updating..." : "New"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={actionKey !== null}
                    onClick={() => changeReservationStatus(reservation.id, "confirmed")}
                  >
                    {actionKey === `reservation-${reservation.id}-confirmed`
                      ? "Updating..."
                      : "Confirmed"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={actionKey !== null}
                    onClick={() => changeReservationStatus(reservation.id, "cancelled")}
                  >
                    {actionKey === `reservation-${reservation.id}-cancelled`
                      ? "Updating..."
                      : "Cancelled"}
                  </button>
                  <span className="pill">{reservation.status}</span>
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}

      {activeTab === "menu" ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
              <h3>Menu Preview</h3>
              <button
                className={`btn ${isMenuEditMode ? "btn-primary" : "btn-secondary"}`}
                type="button"
                onClick={() => setIsMenuEditMode((prev) => !prev)}
              >
                {isMenuEditMode ? "Done editing" : "Edit menu"}
              </button>
            </div>
            <p className="footer-note" style={{ marginTop: "0.6rem" }}>
              {isMenuEditMode
                ? "Edit mode is active. Save each section/item after changes."
                : "Read-only mode. Click Edit menu to modify sections, items, prices and vegetarian flags."}
            </p>
          </section>

          {!isMenuEditMode ? (
            sortedSections.map((section) => (
              <section className="card" key={section.id}>
                <h3>{section.titleEn}</h3>
                <p className="footer-note" style={{ marginTop: "0.3rem" }}>
                  {section.titlePt}
                </p>
                {section.subtitleEn ? (
                  <p className="footer-note" style={{ marginTop: "0.3rem" }}>
                    {section.subtitleEn}
                  </p>
                ) : null}
                <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.55rem" }}>
                  {section.items.map((item) => (
                    <article key={item.id} className="card" style={{ padding: "0.7rem" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "0.7rem",
                          alignItems: "baseline",
                        }}
                      >
                        <strong>
                          {item.nameEn}
                          {item.vegetarian ? " 🌱" : ""}
                        </strong>
                        <span className="pill">{item.price}</span>
                      </div>
                      <p className="footer-note" style={{ marginTop: "0.25rem" }}>
                        {item.descriptionEn}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))
          ) : null}

          {isMenuEditMode ? (
            <>
              <section className="card">
            <h3 style={{ marginBottom: "0.7rem" }}>Add Section</h3>
            <form onSubmit={createSection} className="form-grid">
              <input
                placeholder="Slug (example: specials)"
                value={newSection.slug}
                onChange={(event) => setNewSection((prev) => ({ ...prev, slug: event.target.value }))}
                required
              />
              <input
                placeholder="Title EN"
                value={newSection.titleEn}
                onChange={(event) => setNewSection((prev) => ({ ...prev, titleEn: event.target.value }))}
                required
              />
              <input
                placeholder="Title PT"
                value={newSection.titlePt}
                onChange={(event) => setNewSection((prev) => ({ ...prev, titlePt: event.target.value }))}
                required
              />
              <input
                placeholder="Subtitle EN (optional)"
                value={newSection.subtitleEn}
                onChange={(event) =>
                  setNewSection((prev) => ({ ...prev, subtitleEn: event.target.value }))
                }
              />
              <input
                placeholder="Subtitle PT (optional)"
                value={newSection.subtitlePt}
                onChange={(event) =>
                  setNewSection((prev) => ({ ...prev, subtitlePt: event.target.value }))
                }
              />
              <button className="btn btn-primary" type="submit" disabled={actionKey !== null}>
                {actionKey === "create-section" ? "Saving..." : "Add section"}
              </button>
            </form>
              </section>

              <section className="card">
                <h3 style={{ marginBottom: "0.7rem" }}>Add Item</h3>
                <form onSubmit={createItem} className="form-grid">
              <select
                value={newItem.sectionId}
                onChange={(event) => setNewItem((prev) => ({ ...prev, sectionId: event.target.value }))}
                required
              >
                <option value="" disabled>
                  Select section
                </option>
                {sortedSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.titleEn}
                  </option>
                ))}
              </select>
              <input
                placeholder="Item name EN"
                value={newItem.nameEn}
                onChange={(event) => setNewItem((prev) => ({ ...prev, nameEn: event.target.value }))}
                required
              />
              <input
                placeholder="Item name PT"
                value={newItem.namePt}
                onChange={(event) => setNewItem((prev) => ({ ...prev, namePt: event.target.value }))}
                required
              />
              <input
                placeholder="Price"
                value={newItem.price}
                onChange={(event) => setNewItem((prev) => ({ ...prev, price: event.target.value }))}
                required
              />
              <input
                placeholder="Description EN"
                value={newItem.descriptionEn}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, descriptionEn: event.target.value }))
                }
                required
              />
              <input
                placeholder="Description PT"
                value={newItem.descriptionPt}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, descriptionPt: event.target.value }))
                }
                required
              />
              <label className="ios-switch-field">
                <input
                  className="ios-switch-input"
                  type="checkbox"
                  checked={newItem.vegetarian}
                  onChange={(event) =>
                    setNewItem((prev) => ({ ...prev, vegetarian: event.target.checked }))
                  }
                />
                <span className="ios-switch" aria-hidden="true" />
                <span>Vegetarian</span>
              </label>
                  <button className="btn btn-primary" type="submit" disabled={actionKey !== null}>
                    {actionKey === "create-item" ? "Saving..." : "Add item"}
                  </button>
                </form>
              </section>

              {sortedSections.map((section) => (
                <section className="card" key={section.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.7rem",
                      marginBottom: "0.7rem",
                    }}
                  >
                    <h3 style={{ marginBottom: 0 }}>Section: {section.titleEn}</h3>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() =>
                        setExpandedSectionId((prev) => (prev === section.id ? null : section.id))
                      }
                    >
                      {expandedSectionId === section.id ? "Collapse" : "Edit"}
                    </button>
                  </div>

                  {expandedSectionId !== section.id ? (
                    <p className="footer-note" style={{ marginTop: 0 }}>
                      Collapsed. Tap Edit to open this section.
                    </p>
                  ) : (
                    <>
                  <div className="form-grid" style={{ marginBottom: "0.7rem" }}>
                <input
                  value={section.slug}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, slug: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  value={section.titleEn}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, titleEn: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  value={section.titlePt}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, titlePt: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  value={section.subtitleEn ?? ""}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, subtitleEn: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  value={section.subtitlePt ?? ""}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, subtitlePt: event.target.value }
                          : candidate,
                      ),
                    )
                  }
                />
                <input
                  type="number"
                  value={section.order}
                  onWheel={(event) => (event.currentTarget as HTMLInputElement).blur()}
                  onChange={(event) =>
                    setMenuSections((prev) =>
                      prev.map((candidate) =>
                        candidate.id === section.id
                          ? { ...candidate, order: Number(event.target.value) || 0 }
                          : candidate,
                      ),
                    )
                  }
                />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => saveSection(section)}
                      disabled={actionKey !== null}
                    >
                      {actionKey === `save-section-${section.id}` ? "Saving..." : "Save section"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => deleteSection(section.id)}
                      disabled={actionKey !== null}
                    >
                      {actionKey === `delete-section-${section.id}` ? "Deleting..." : "Delete section"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: "0.8rem" }}>
                    {section.items.map((item) => (
                      <article key={item.id} style={{ borderTop: "1px solid var(--line)", paddingTop: "0.8rem" }}>
                        <div className="form-grid">
                      <input
                        value={item.nameEn}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, nameEn: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        value={item.namePt}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, namePt: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        value={item.price}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, price: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        value={item.descriptionEn}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, descriptionEn: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        value={item.descriptionPt}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, descriptionPt: event.target.value }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <input
                        type="number"
                        value={item.order}
                        onWheel={(event) => (event.currentTarget as HTMLInputElement).blur()}
                        onChange={(event) =>
                          setMenuSections((prev) =>
                            prev.map((candidate) =>
                              candidate.id === section.id
                                ? {
                                    ...candidate,
                                    items: candidate.items.map((itemCandidate) =>
                                      itemCandidate.id === item.id
                                        ? { ...itemCandidate, order: Number(event.target.value) || 0 }
                                        : itemCandidate,
                                    ),
                                  }
                                : candidate,
                            ),
                          )
                        }
                      />
                      <label className="ios-switch-field">
                        <input
                          className="ios-switch-input"
                          type="checkbox"
                          checked={item.vegetarian}
                          onChange={(event) =>
                            setMenuSections((prev) =>
                              prev.map((candidate) =>
                                candidate.id === section.id
                                  ? {
                                      ...candidate,
                                      items: candidate.items.map((itemCandidate) =>
                                        itemCandidate.id === item.id
                                          ? { ...itemCandidate, vegetarian: event.target.checked }
                                          : itemCandidate,
                                      ),
                                    }
                                  : candidate,
                              ),
                            )
                          }
                        />
                        <span className="ios-switch" aria-hidden="true" />
                        <span>Vegetarian</span>
                      </label>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                          <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => saveItem(item)}
                            disabled={actionKey !== null}
                          >
                            {actionKey === `save-item-${item.id}` ? "Saving..." : "Save item"}
                          </button>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            disabled={actionKey !== null}
                          >
                            {actionKey === `delete-item-${item.id}` ? "Deleting..." : "Delete item"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                    </>
                  )}
                </section>
              ))}
            </>
          ) : null}
        </div>
      ) : null}

      {activeTab === "security" ? (
        <section className="card">
          <h3 style={{ marginBottom: "0.7rem" }}>Change Admin Password</h3>
          <form onSubmit={onPasswordSubmit} className="form-grid">
            <input
              placeholder="Username"
              value={passwordForm.username}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, username: event.target.value }))
              }
              required
            />
            <input
              placeholder="Current password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
              required
            />
            <input
              placeholder="New password"
              type="password"
              minLength={6}
              value={passwordForm.nextPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, nextPassword: event.target.value }))
              }
              required
            />
            <button className="btn btn-primary" type="submit" disabled={actionKey !== null}>
              {actionKey === "update-password" ? "Updating..." : "Update password"}
            </button>
          </form>
          <p className="footer-note">Admin credentials are now stored in Prisma.</p>
        </section>
      ) : null}
    </div>
  );
}
