export const config = {
    maxEnergy: 100,
    levelNames: ["", "Homeless", "Street Cat", "Hustler", "Mouser", "Junior Entrepreneur", "Businessman", "Manager", "Tycoon", "Magnate", "Chairman", "Catpitalist", "The Marquess", "King of the Pride", "The Legend", "The Cat-peror"],
    scoreToNextLevel: [0, 500, 1500, 4000, 12000, 40000, 150000, 500000, 2000000, 10000000, 50000000, 250000000, 1500000000, 10000000000, 100000000000, 1000000000000],
    tapValueLevels: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50],
    profitPerHourLevels: [0, 10, 50, 200, 750, 2500, 10000, 40000, 150000, 600000, 2500000, 12000000, 60000000, 300000000, 2000000000, 15000000000],
    catImageLevels: ["", "CAT1.png", "CAT2.png", "CAT3.png", "CAT4.png", "CAT5.png", "CAT6.png", "CAT7.png", "CAT8.png", "CAT9.png", "CAT10.png", "CAT11.png", "CAT12.png", "CAT13.png", "CAT14.png", "CAT15.png"],
    energyPerSecondLevels: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 10],
    upgradesData: [
        { id: 'claws_1', name: 'Sharpen Claws', type: 'tap', image: 'claws.png', requiredLevel: 1, currentLevel: 1, bonusValue: 1, price: 250 },
        { id: 'claws_2', name: 'Soft Paws', type: 'tap', image: 'paws.png', requiredLevel: 1, currentLevel: 2, bonusValue: 2, price: 1000 },
        { id: 'lucky_1', name: 'Lucky Paw', type: 'tap', image: 'lucky.png', requiredLevel: 4, currentLevel: 0, bonusValue: 5, price: 5000 }
    ]
};