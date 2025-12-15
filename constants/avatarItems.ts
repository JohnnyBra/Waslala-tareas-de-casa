export const AVATAR_ITEMS = [
  // Bases (Bodies)
  { id: 'base_boy', type: 'base', name: 'Niño', cost: 0, svg: 'base_boy' },
  { id: 'base_girl', type: 'base', name: 'Niña', cost: 0, svg: 'base_girl' },
  { id: 'base_hero', type: 'base', name: 'Superhéroe', cost: 1000, svg: 'base_hero' },
  { id: 'base_robot', type: 'base', name: 'Robot', cost: 1000, svg: 'base_robot' },

  // Tops
  { id: 'top_tshirt_red', type: 'top', name: 'Camiseta Roja', cost: 0, svg: 'top_tshirt_red' },
  { id: 'top_tshirt_blue', type: 'top', name: 'Camiseta Azul', cost: 200, svg: 'top_tshirt_blue' },
  { id: 'top_tshirt_green', type: 'top', name: 'Camiseta Verde', cost: 200, svg: 'top_tshirt_green' },
  { id: 'top_dress_pink', type: 'top', name: 'Vestido Rosa', cost: 200, svg: 'top_dress_pink' },

  // Bottoms
  { id: 'bot_shorts_blue', type: 'bottom', name: 'Pantalones Cortos', cost: 0, svg: 'bot_shorts_blue' },
  { id: 'bot_skirt_purple', type: 'bottom', name: 'Falda Morada', cost: 0, svg: 'bot_skirt_purple' },
  { id: 'bot_jeans', type: 'bottom', name: 'Vaqueros', cost: 200, svg: 'bot_jeans' },

  // Shoes
  { id: 'shoes_sneakers', type: 'shoes', name: 'Zapatillas', cost: 0, svg: 'shoes_sneakers' },
  { id: 'shoes_boots', type: 'shoes', name: 'Botas', cost: 200, svg: 'shoes_boots' },

  // Accessories
  { id: 'acc_cap', type: 'accessory', name: 'Gorra', cost: 200, svg: 'acc_cap' },
  { id: 'acc_glasses', type: 'accessory', name: 'Gafas', cost: 200, svg: 'acc_glasses' },
  { id: 'acc_cape', type: 'accessory', name: 'Capa', cost: 200, svg: 'acc_cape' },
  { id: 'acc_crown', type: 'accessory', name: 'Corona', cost: 500, svg: 'acc_crown' },
];

export const getItemById = (id: string) => AVATAR_ITEMS.find(i => i.id === id);
