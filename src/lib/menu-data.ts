import type { MenuCategory } from "@/lib/types";

const t = (en: string, pt?: string) => ({ en, pt: pt ?? en });

export const menuData: MenuCategory[] = [
  {
    id: "starters",
    title: t("Starters", "Entradas"),
    items: [
      {
        name: t("Nachos"),
        price: "10 EUR",
        description: t(
          "Corn chips, beans, chili con carne or guacamole, cheese, pico de gallo, house sauce.",
          "Tiras de milho, feijao, chili con carne ou guacamole, queijo, pico de gallo, molho da casa.",
        ),
      },
      {
        name: t("Guacamole"),
        price: "6.5 EUR",
        vegetarian: true,
        description: t(
          "Crushed avocado, onion, tomato, coriander, lime. Served with corn chips.",
          "Abacate triturado, cebola, tomate, coentro e lima. Servido com tiras de milho.",
        ),
      },
      {
        name: t("Pico de Gallo"),
        price: "5 EUR",
        vegetarian: true,
        description: t(
          "Mexican salad with onion, tomato, coriander, lime and corn chips.",
          "Salada mexicana com cebola, tomate, coentro, lima e tiras de milho.",
        ),
      },
      {
        name: t("Frijol Refrito"),
        price: "5 EUR",
        vegetarian: true,
        description: t(
          "Refried crushed beans with onion. Served with corn chips.",
          "Feijao triturado refrito com cebola. Servido com tiras de milho.",
        ),
      },
      {
        name: t("Jalapenos Recheados"),
        price: "6 EUR",
        description: t(
          "Cream cheese stuffed jalapenos, breaded, with chipotle mayo.",
          "Jalapenos recheados com cream cheese e empanados, com maionese chipotle.",
        ),
      },
      {
        name: t("Quesadilla Puro Queso"),
        price: "5 EUR",
        vegetarian: true,
        description: t(
          "Cheese-filled folded tortilla with pico de gallo and salsa verde.",
          "Tortilha dobrada recheada com queijo, pico de gallo e salsa verde.",
        ),
      },
      {
        name: t("Tostadas"),
        price: "6 EUR",
        description: t(
          "Fried tortilla with tinga shredded chicken and spicy sauce.",
          "Tortilha frita com tinga de frango desfiado e molho picante.",
        ),
      },
    ],
  },
  {
    id: "tacos",
    title: t("Tacos"),
    subtitle: t("Choose corn or wheat tortilla.", "Escolha tortilha de milho ou trigo."),
    items: [
      {
        name: t("Pastor"),
        price: "9 EUR",
        description: t(
          "Pork marinated in dried peppers and spices with onion, pineapple, lime.",
          "Porco marinado em pimentoes secos e especiarias com cebola, ananas e lima.",
        ),
      },
      {
        name: t("Carnitas"),
        price: "10 EUR",
        description: t(
          "Pork slow-cooked in orange juice, lard and spices with onion and lime.",
          "Porco cozido lentamente em sumo de laranja, banha e especiarias com cebola e lima.",
        ),
      },
      {
        name: t("Campechano"),
        price: "10 EUR",
        description: t(
          "Mix of pastor and carnitas with onion, coriander, house sauce.",
          "Mistura de pastor e carnitas com cebola, coentro e molho da casa.",
        ),
      },
      {
        name: t("Peixe", "Peixe"),
        price: "10 EUR",
        description: t(
          "Fish tempura with white and purple cabbage, chipotle mayo.",
          "Tempura de peixe com repolho branco e roxo, maionese chipotle.",
        ),
      },
      {
        name: t("Camarao", "Camarao"),
        price: "10 EUR",
        description: t(
          "Shrimp tempura with white and purple cabbage, chipotle mayo.",
          "Tempura de camarao com repolho branco e roxo, maionese chipotle.",
        ),
      },
      {
        name: t("Tinga (Chicken)", "Tinga (Frango)"),
        price: "10 EUR",
        description: t(
          "Shredded chicken in smoky tomato and onion sauce.",
          "Frango desfiado em molho fumado de tomate e cebola.",
        ),
      },
    ],
  },
  {
    id: "burritos",
    title: t("Burritos"),
    subtitle: t(
      "All include beans and cheese. Fried or grilled.",
      "Todos incluem feijao e queijo. Fritos ou grelhados.",
    ),
    items: [
      {
        name: t("Mix Frijol y Arroz"),
        price: "8 EUR",
        vegetarian: true,
        description: t(
          "Beans, onion, rice, cheese in wheat tortilla.",
          "Feijao, cebola, arroz e queijo em tortilha de trigo.",
        ),
      },
      {
        name: t("Pastor"),
        price: "10 EUR",
        description: t(
          "Beans, onion, cheese, pineapple and pastor meat.",
          "Feijao, cebola, queijo, ananas e carne de pastor.",
        ),
      },
      {
        name: t("Carnitas"),
        price: "10 EUR",
        description: t(
          "Beans, cheese, orange-marinated pork, coriander, onion.",
          "Feijao, queijo, porco marinado em laranja, coentro e cebola.",
        ),
      },
      {
        name: t("Campechano"),
        price: "10 EUR",
        description: t(
          "Beans, mixed meats, cheese, onion, cilantro.",
          "Feijao, mistura de carnes, queijo, cebola e coentros.",
        ),
      },
      {
        name: t("Chicken", "Frango"),
        price: "9 EUR",
        description: t(
          "Beans, onion, cheese and chicken.",
          "Feijao, cebola, queijo e frango.",
        ),
      },
    ],
  },
  {
    id: "signature",
    title: t("Signature", "Assinatura"),
    subtitle: t("Chef signature dishes.", "Pratos de assinatura do chef."),
    items: [
      {
        name: t("Fajita"),
        price: "Beef 13€ · Ch 12€ · Veg 11€",
        description: t(
          "Sizzling meat with bell peppers and onion. Comes with refried beans and tortillas.",
          "Carne a chiar com pimentoes e cebola. Acompanha feijao refrito e tortilhas.",
        ),
      },
      {
        name: t("Bir-Ria"),
        price: "14 EUR",
        description: t(
          "Traditional slow-cooked beef. Available as taco or burrito.",
          "Carne tradicional cozida lentamente. Disponivel em taco ou burrito.",
        ),
      },
      {
        name: t("Enchiladas Suizas"),
        price: "11 EUR",
        description: t(
          "Three tortillas with chicken, creamy green sauce, gratin and beans.",
          "Tres tortilhas com frango, molho verde cremoso, gratinado e feijao.",
        ),
      },
      {
        name: t("Quesadilla con Guisado"),
        price: "12 EUR",
        description: t("Cheese and meat filling with pico de gallo.", "Recheio de queijo e carne com pico de gallo."),
      },
      {
        name: t("Garlic Mushrooms", "Cogumelos de Alho"),
        price: "9 EUR",
        vegetarian: true,
        description: t(
          "Sauteed mushrooms with garlic, guajillo pepper, butter and lime.",
          "Cogumelos salteados com alho, pimenta guajillo, manteiga e lima.",
        ),
      },
    ],
  },
  {
    id: "desserts",
    title: t("Desserts", "Sobremesas"),
    items: [
      {
        name: t("Pastel 3 Leches"),
        price: "5 EUR",
        description: t(
          "Traditional Mexican cake soaked in three milks and vanilla, with whipped cream.",
          "Bolo mexicano tradicional embebido em tres leites e baunilha, com chantilly.",
        ),
      },
      {
        name: t("Chocolate Lava Cake", "Vulcao de Chocolate"),
        price: "6 EUR",
        description: t(
          "Chocolate lava cake with vanilla ice cream and chocolate sauce.",
          "Bolo de lava de chocolate com gelado de baunilha e calda de chocolate.",
        ),
      },
      {
        name: t("Churros"),
        price: "5 EUR",
        description: t(
          "Classic churros with sugar, cinnamon and chocolate cream.",
          "Churros classicos com acucar, canela e creme de chocolate.",
        ),
      },
      {
        name: t("Extras and Add-ons", "Extras"),
        price: "2-4.5 EUR",
        description: t(
          "Guacamole, salsa verde, salsa roja, frijol refrito, sour cream, corn chips and more.",
          "Guacamole, salsa verde, salsa roja, frijol refrito, sour cream, tiras de milho e mais.",
        ),
      },
    ],
  },
  {
    id: "drinks",
    title: t("Drinks", "Bebidas"),
    items: [
      {
        name: t("Tlaloc Margarita", "Margarita Tlaloc"),
        price: "7 EUR",
        description: t(
          "Lime, strawberry, mango or blue. Tequila Cuervo and Cointreau.",
          "Lima, morango, manga ou azul. Tequila Cuervo e Cointreau.",
        ),
      },
      {
        name: t("Spicy Margarita", "Margarita Picante"),
        price: "8 EUR",
        description: t("Lime, mango or tamarind with jalapeno.", "Lima, manga ou tamarindo com jalapeno."),
      },
      {
        name: t("Paloma"),
        price: "9 EUR",
        description: t("Tequila, lime, grapefruit, agave and soda.", "Tequila, lima, toranja, agave e soda."),
      },
      {
        name: t("Mezcalita"),
        price: "9 EUR",
        description: t("Mezcal, lime, agave, worm salt.", "Mezcal, lima, agave, sal de minhoca."),
      },
      {
        name: t("Corona"),
        price: "3 EUR",
        description: t("Bottle 33cl.", "Garrafa 33cl."),
      },
      {
        name: t("Pacifico"),
        price: "4.5 EUR",
        description: t("Bottle 33cl.", "Garrafa 33cl."),
      },
      {
        name: t("Virgin Margarita", "Margarita Sem Alcool"),
        price: "7 EUR",
        description: t("Lime, strawberry, mango or blue.", "Lima, morango, manga ou azul."),
      },
      {
        name: t("Horchata"),
        price: "4 EUR",
        description: t("Rice, milk and cinnamon.", "Arroz, leite e canela."),
      },
    ],
  },
];
