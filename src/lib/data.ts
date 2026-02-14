export const CATEGORIES = [
    { id: 'momo', nameEn: 'Momo', nameNp: 'मोमो' },
    { id: 'noodles', nameEn: 'Noodles', nameNp: 'चाउमिन/थुक्पा' },
    { id: 'drinks', nameEn: 'Drinks', nameNp: 'पेय पदार्थ' },
];

export const MENU_ITEMS = [
    {
        id: '1',
        nameEn: 'Steam Buff Momo',
        nameNp: 'बफ मोमो (स्टिम)',
        description: 'Juicy buff mince filled dumplings, served with spicy dunks.',
        price: 150,
        categoryId: 'momo',
        image: '/images/momo-buff.png',
        isAvailable: true,
    },
    {
        id: '2',
        nameEn: 'Veg Momo',
        nameNp: 'भेज मोमो',
        description: 'Fresh vegetable filling with special herbs.',
        price: 120,
        categoryId: 'momo',
        image: '/images/momo-veg.png',
        isAvailable: true,
    },
    {
        id: '3',
        nameEn: 'Chicken Thukpa',
        nameNp: 'चिकेन थुक्पा',
        description: 'Hot noodle soup with chicken and veggies.',
        price: 180,
        categoryId: 'noodles',
        image: '/images/thukpa.png',
        isAvailable: true,
    },
    {
        id: '4',
        nameEn: 'Masala Tea',
        nameNp: 'मसला चिया',
        description: 'Authentic Nepali masala tea.',
        price: 50,
        categoryId: 'drinks',
        image: '/images/tea.png',
        isAvailable: true,
    },
];
