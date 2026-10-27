import { YugiohCard, MetaResource } from '../types/card';

export const INITIAL_ACE_CARDS: YugiohCard[] = [
  {
    id: 89631139,
    name: "Blue-Eyes White Dragon",
    type: "Normal Monster",
    frameType: "normal",
    desc: "This legendary dragon is a powerful engine of destruction. Virtually invincible, very few have faced this awesome beast and lived to tell the tale.",
    race: "Dragon",
    atk: 3000,
    def: 2500,
    level: 8,
    attribute: "LIGHT",
    archetype: "Blue-Eyes",
    card_images: [
      {
        id: 89631139,
        image_url: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/89631139.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/89631139.jpg"
      }
    ],
    card_sets: [
      { set_name: "Legend of Blue Eyes White Dragon", set_code: "LOB-001", set_rarity: "Ultra Rare" }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/blue-eyes-white-dragon-7498",
    card_prices: [{ tcgplayer_price: "1.85", cardmarket_price: "1.40" }]
  },
  {
    id: 46986414,
    name: "Dark Magician",
    type: "Normal Monster",
    frameType: "normal",
    desc: "The ultimate wizard in terms of attack and defense.",
    race: "Spellcaster",
    atk: 2500,
    def: 2100,
    level: 7,
    attribute: "DARK",
    archetype: "Dark Magician",
    card_images: [
      {
        id: 46986414,
        image_url: "https://images.ygoprodeck.com/images/cards/46986414.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/46986414.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/46986414.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/dark-magician-4003",
    card_prices: [{ tcgplayer_price: "1.50", cardmarket_price: "1.20" }]
  },
  {
    id: 89943723,
    name: "Elemental HERO Neos",
    type: "Normal Monster",
    frameType: "normal",
    desc: "A new Elemental HERO has arrived from Neo-Space! When he initiates a Contact Fusion with a Neo-Spacian his unknown powers are unleashed.",
    race: "Warrior",
    atk: 2500,
    def: 2000,
    level: 7,
    attribute: "LIGHT",
    archetype: "Elemental HERO",
    card_images: [
      {
        id: 89943723,
        image_url: "https://images.ygoprodeck.com/images/cards/89943723.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/89943723.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/89943723.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/elemental-hero-neos-7561",
    card_prices: [{ tcgplayer_price: "0.75", cardmarket_price: "0.60" }]
  },
  {
    id: 44508094,
    name: "Stardust Dragon",
    type: "Synchro Monster",
    frameType: "synchro",
    desc: "1 Tuner + 1+ non-Tuner monsters\nWhen a card or effect is activated that would destroy a card(s) on the field (Quick Effect): You can Tribute this card; negate the activation, and if you do, destroy it. During the End Phase, if this effect was activated this turn (and was not negated): You can Special Summon this card from your GY.",
    race: "Dragon",
    atk: 2500,
    def: 2000,
    level: 8,
    attribute: "WIND",
    archetype: "Stardust",
    card_images: [
      {
        id: 44508094,
        image_url: "https://images.ygoprodeck.com/images/cards/44508094.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/44508094.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/44508094.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/stardust-dragon-3807",
    card_prices: [{ tcgplayer_price: "2.20", cardmarket_price: "1.90" }]
  },
  {
    id: 84013238,
    name: "Number 39: Utopia",
    type: "XYZ Monster",
    frameType: "xyz",
    desc: "2 Level 4 monsters\nWhen a monster declares an attack: You can detach 1 material from this card; negate the attack. If this card is targeted for an attack, while it has no material: Destroy this card.",
    race: "Warrior",
    atk: 2500,
    def: 2000,
    level: 4,
    attribute: "LIGHT",
    archetype: "Utopia",
    card_images: [
      {
        id: 84013238,
        image_url: "https://images.ygoprodeck.com/images/cards/84013238.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/84013238.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/84013238.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/number-39-utopia-7153",
    card_prices: [{ tcgplayer_price: "0.85", cardmarket_price: "0.70" }]
  },
  {
    id: 1861629,
    name: "Decode Talker",
    type: "Link Monster",
    frameType: "link",
    desc: "2+ Effect Monsters\nGains 500 ATK for each monster it points to. When your opponent activates a card or effect that targets a card(s) you control (Quick Effect): You can Tribute 1 monster this card points to; negate the activation, and if you do, destroy that card.",
    race: "Cyberse",
    atk: 2300,
    linkval: 3,
    linkmarkers: ["Top", "Bottom-Left", "Bottom-Right"],
    attribute: "DARK",
    archetype: "Code Talker",
    card_images: [
      {
        id: 1861629,
        image_url: "https://images.ygoprodeck.com/images/cards/1861629.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/1861629.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/1861629.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/decode-talker-157",
    card_prices: [{ tcgplayer_price: "0.45", cardmarket_price: "0.35" }]
  }
];

export const FALLBACK_CARDS: YugiohCard[] = [
  {
    id: 89631139,
    name: "Blue-Eyes White Dragon",
    type: "Normal Monster",
    frameType: "normal",
    desc: "This legendary dragon is a powerful engine of destruction. Virtually invincible, very few have faced this awesome beast and lived to tell the tale.",
    race: "Dragon",
    atk: 3000,
    def: 2500,
    level: 8,
    attribute: "LIGHT",
    archetype: "Blue-Eyes",
    card_images: [
      {
        id: 89631139,
        image_url: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/89631139.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/89631139.jpg"
      }
    ],
    card_sets: [
      { set_name: "Legend of Blue Eyes White Dragon", set_code: "LOB-001", set_rarity: "Ultra Rare" }
    ]
  },
  {
    id: 46986414,
    name: "Dark Magician",
    type: "Normal Monster",
    frameType: "normal",
    desc: "The ultimate wizard in terms of attack and defense.",
    race: "Spellcaster",
    atk: 2500,
    def: 2100,
    level: 7,
    attribute: "DARK",
    archetype: "Dark Magician",
    card_images: [
      {
        id: 46986414,
        image_url: "https://images.ygoprodeck.com/images/cards/46986414.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/46986414.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/46986414.jpg"
      }
    ]
  },
  // Pendulum Monster 1: Astrograph Sorcerer (Scale 1)
  {
    id: 13893596,
    name: "Astrograph Sorcerer",
    type: "Pendulum Effect Monster",
    frameType: "pendulum_effect",
    desc: "[ Pendulum Effect ]\nDuring your Main Phase: You can destroy this card, and if you do, take 1 \"Stargazer Magician\" from your hand or Deck, and either place it in your Pendulum Zone or Special Summon it. You can only use this effect of \"Astrograph Sorcerer\" once per turn.\n\n[ Monster Effect ]\nIf a card(s) you control is destroyed by battle or card effect: You can Special Summon this card from your hand, then you can choose 1 monster in the GY, Extra Deck, or that is banished, that was destroyed this turn, and add 1 monster with the same name from your Deck to your hand. You can banish this card you control, plus 4 monsters from your hand, field, and/or GY (1 each with \"Pendulum Dragon\", \"Xyz Dragon\", \"Synchro Dragon\", and \"Fusion Dragon\" in their names); Special Summon 1 \"Supreme King Z-ARC\" from your Extra Deck. (This is treated as a Fusion Summon.)",
    race: "Spellcaster",
    atk: 2500,
    def: 2000,
    level: 7,
    scale: 1,
    attribute: "DARK",
    archetype: "Magician",
    card_images: [
      {
        id: 13893596,
        image_url: "https://images.ygoprodeck.com/images/cards/13893596.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/13893596.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/13893596.jpg"
      }
    ],
    banlist_info: { ban_tcg: "Limited", ban_ocg: "Limited" }
  },
  // Pendulum Monster 2: Performapal Skullcrobat Joker (Scale 8)
  {
    id: 64184058,
    name: "Performapal Skullcrobat Joker",
    type: "Pendulum Effect Monster",
    frameType: "pendulum_effect",
    desc: "[ Pendulum Effect ]\nYou cannot Pendulum Summon monsters, except \"Performapal\" monsters, \"Magician\" Pendulum Monsters, and \"Odd-Eyes\" monsters. This effect cannot be negated.\n\n[ Monster Effect ]\nWhen this card is Normal Summoned: You can add 1 \"Performapal\" monster, \"Magician\" Pendulum Monster, or \"Odd-Eyes\" monster from your Deck to your hand, except \"Performapal Skullcrobat Joker\".",
    race: "Spellcaster",
    atk: 1800,
    def: 100,
    level: 4,
    scale: 8,
    attribute: "DARK",
    archetype: "Performapal",
    card_images: [
      {
        id: 64184058,
        image_url: "https://images.ygoprodeck.com/images/cards/64184058.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/64184058.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/64184058.jpg"
      }
    ]
  },
  // Spirit Monster: Tsukuyomi
  {
    id: 34853266,
    name: "Tsukuyomi",
    type: "Spirit Monster",
    frameType: "effect",
    desc: "Cannot be Special Summoned. During the End Phase of the turn this card is Normal Summoned or flipped face-up: Return it to the hand. If this card is Normal Summoned or flipped face-up: Target 1 face-up monster on the field; change that target to face-down Defense Position.",
    race: "Spellcaster",
    atk: 1100,
    def: 1400,
    level: 4,
    attribute: "DARK",
    card_images: [
      {
        id: 34853266,
        image_url: "https://images.ygoprodeck.com/images/cards/34853266.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/34853266.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/34853266.jpg"
      }
    ]
  },
  // Ritual Monster: Black Luster Soldier
  {
    id: 5405694,
    name: "Black Luster Soldier",
    type: "Ritual Monster",
    frameType: "ritual",
    desc: "You can Ritual Summon this card with \"Black Luster Ritual\".",
    race: "Warrior",
    atk: 3000,
    def: 2500,
    level: 8,
    attribute: "EARTH",
    archetype: "Black Luster Soldier",
    card_images: [
      {
        id: 5405694,
        image_url: "https://images.ygoprodeck.com/images/cards/5405694.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/5405694.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/5405694.jpg"
      }
    ]
  },
  // XYZ Monster: Number 39: Utopia
  {
    id: 84013238,
    name: "Number 39: Utopia",
    type: "XYZ Monster",
    frameType: "xyz",
    desc: "2 Level 4 monsters\nWhen a monster declares an attack: You can detach 1 material from this card; negate the attack. If this card is targeted for an attack, while it has no material: Destroy this card.",
    race: "Warrior",
    atk: 2500,
    def: 2000,
    level: 4,
    attribute: "LIGHT",
    archetype: "Utopia",
    card_images: [
      {
        id: 84013238,
        image_url: "https://images.ygoprodeck.com/images/cards/84013238.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/84013238.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/84013238.jpg"
      }
    ]
  },
  // Synchro Monster: Baronne de Fleur
  {
    id: 84013237,
    name: "Baronne de Fleur",
    type: "Synchro Monster",
    frameType: "synchro",
    desc: "1 Tuner + 1+ non-Tuner monsters\nOnce per turn: You can target 1 card on the field; destroy it. Once while face-up on the field, when a card or effect is activated (Quick Effect): You can negate the activation, and if you do, destroy that card. You can only use the previous effect of \"Baronne de Fleur\" once per turn. Once per turn, during the Standby Phase: You can target 1 Level 9 or lower monster in your GY; return this card to the Extra Deck, and if you do, Special Summon that monster.",
    race: "Warrior",
    atk: 3000,
    def: 2400,
    level: 10,
    attribute: "WIND",
    archetype: "Fleur",
    card_images: [
      {
        id: 84013237,
        image_url: "https://images.ygoprodeck.com/images/cards/84013237.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/84013237.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/84013237.jpg"
      }
    ],
    banlist_info: { ban_tcg: "Forbidden", ban_ocg: "Forbidden" }
  },
  // Link Monster: Accesscode Talker
  {
    id: 86066372,
    name: "Accesscode Talker",
    type: "Link Monster",
    frameType: "link",
    desc: "2+ Effect Monsters\nYour opponent cannot activate cards or effects in response to this card's effect activations. If this card is Link Summoned: You can target 1 Link Monster used as material; this card gains ATK equal to that monster's Link Rating x 1000. You can banish 1 Link Monster from your field or GY; destroy 1 card your opponent controls, also for the rest of this turn, you cannot banish monsters with that same Attribute to activate this effect of \"Accesscode Talker\".",
    race: "Cyberse",
    atk: 2300,
    linkval: 4,
    linkmarkers: ["Top", "Bottom", "Left", "Right"],
    attribute: "DARK",
    archetype: "Code Talker",
    card_images: [
      {
        id: 86066372,
        image_url: "https://images.ygoprodeck.com/images/cards/86066372.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/86066372.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/86066372.jpg"
      }
    ]
  },
  {
    id: 14558127,
    name: "Ash Blossom & Joyous Spring",
    type: "Tuner Monster",
    frameType: "effect",
    desc: "When a card or effect is activated that includes any of these effects (Quick Effect): You can discard this card; negate that effect.\n● Add a card from the Deck to the hand.\n● Special Summon from the Deck.\n● Send a card from the Deck to the GY.\nYou can only use this effect of \"Ash Blossom & Joyous Spring\" once per turn.",
    race: "Zombie",
    atk: 0,
    def: 1800,
    level: 3,
    attribute: "FIRE",
    archetype: "Ghost Girl",
    card_images: [
      {
        id: 14558127,
        image_url: "https://images.ygoprodeck.com/images/cards/14558127.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/14558127.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/14558127.jpg"
      }
    ],
    banlist_info: { ban_tcg: "Unlimited", ban_ocg: "Semi-Limited", ban_goat: "Not in Goat" }
  },
  {
    id: 55144522,
    name: "Pot of Greed",
    type: "Spell Card",
    frameType: "spell",
    desc: "Draw 2 cards.",
    race: "Normal",
    card_images: [
      {
        id: 55144522,
        image_url: "https://images.ygoprodeck.com/images/cards/55144522.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/55144522.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/55144522.jpg"
      }
    ],
    banlist_info: { ban_tcg: "Forbidden", ban_ocg: "Forbidden", ban_goat: "Limited" }
  },
  {
    id: 10045474,
    name: "Infinite Impermanence",
    type: "Trap Card",
    frameType: "trap",
    desc: "Target 1 face-up monster your opponent controls; negate its effects (until the end of this turn), then, if this card was Set before activation and is on the field at resolution, for the rest of this turn all other Spell/Trap effects in this column are negated. If you control no cards, you can activate this card from your hand.",
    race: "Normal",
    card_images: [
      {
        id: 10045474,
        image_url: "https://images.ygoprodeck.com/images/cards/10045474.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/10045474.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/10045474.jpg"
      }
    ]
  },
  {
    id: 41420027,
    name: "Solemn Judgment",
    type: "Trap Card",
    frameType: "trap",
    desc: "When a monster(s) would be Summoned, OR a Spell/Trap Card is activated: Pay half your LP; negate the Summon or activation, and if you do, destroy that card.",
    race: "Counter",
    card_images: [
      {
        id: 41420027,
        image_url: "https://images.ygoprodeck.com/images/cards/41420027.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/41420027.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/41420027.jpg"
      }
    ]
  },
  {
    id: 18144506,
    name: "Raigeki",
    type: "Spell Card",
    frameType: "spell",
    desc: "Destroy all monsters your opponent controls.",
    race: "Normal",
    card_images: [
      {
        id: 18144506,
        image_url: "https://images.ygoprodeck.com/images/cards/18144506.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/18144506.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/18144506.jpg"
      }
    ]
  },
  {
    id: 44095762,
    name: "Mirror Force",
    type: "Trap Card",
    frameType: "trap",
    desc: "When an opponent's monster declares an attack: Destroy all your opponent's Attack Position monsters.",
    race: "Normal",
    card_images: [
      {
        id: 44095762,
        image_url: "https://images.ygoprodeck.com/images/cards/44095762.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/44095762.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/44095762.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/mirror-force-3759"
  },
  {
    id: 5318639,
    name: "Mystical Space Typhoon",
    type: "Spell Card",
    frameType: "spell",
    desc: "Target 1 Spell/Trap on the field; destroy that target.",
    race: "Quick-Play",
    card_images: [
      {
        id: 5318639,
        image_url: "https://images.ygoprodeck.com/images/cards/5318639.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/5318639.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/5318639.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/mystical-space-typhoon-1990"
  },
  {
    id: 47355498,
    name: "Necrovalley",
    type: "Spell Card",
    frameType: "spell",
    desc: "All \"Gravekeeper's\" monsters gain 500 ATK/DEF. Cards in the GY cannot be banished. Negate any card effect that would move a card in the GY to a different place. Negate any card effect that changes Types or Attributes in the GY.",
    race: "Field",
    card_images: [
      {
        id: 47355498,
        image_url: "https://images.ygoprodeck.com/images/cards/47355498.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/47355498.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/47355498.jpg"
      }
    ],
    archetype: "Gravekeeper's",
    ygoprodeck_url: "https://ygoprodeck.com/card/necrovalley-4687"
  },
  {
    id: 56747793,
    name: "United We Stand",
    type: "Spell Card",
    frameType: "spell",
    desc: "The equipped monster gains 800 ATK/DEF for each face-up monster you control.",
    race: "Equip",
    card_images: [
      {
        id: 56747793,
        image_url: "https://images.ygoprodeck.com/images/cards/56747793.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/56747793.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/56747793.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/united-we-stand-5735"
  },
  {
    id: 55761792,
    name: "Black Luster Ritual",
    type: "Spell Card",
    frameType: "spell",
    desc: "This card is used to Ritual Summon \"Black Luster Soldier\". You must also Tribute monsters from your hand or field whose total Levels equal 8 or more.",
    race: "Ritual",
    card_images: [
      {
        id: 55761792,
        image_url: "https://images.ygoprodeck.com/images/cards/55761792.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/55761792.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/55761792.jpg"
      }
    ],
    archetype: "Black Luster Soldier",
    ygoprodeck_url: "https://ygoprodeck.com/card/black-luster-ritual-5484"
  },
  {
    id: 82732705,
    name: "Skill Drain",
    type: "Trap Card",
    frameType: "trap",
    desc: "Activate this card by paying 1000 LP. Negate the effects of all face-up monsters while they are face-up on the field (but their effects can still be activated).",
    race: "Continuous",
    card_images: [
      {
        id: 82732705,
        image_url: "https://images.ygoprodeck.com/images/cards/82732705.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/82732705.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/82732705.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/skill-drain-8278"
  },
  {
    id: 61280702,
    name: "Nightmare Magician",
    type: "Effect Monster",
    frameType: "effect",
    desc: "If this card battles a monster, neither can be destroyed by that battle. At the end of the Damage Step, if this card battled an opponent's monster: You can take control of that opponent's monster. Once per turn, when another monster declares an attack: You can target 1 card on the field; destroy it.",
    race: "Illusion",
    atk: 2500,
    def: 2000,
    level: 7,
    attribute: "DARK",
    card_images: [
      {
        id: 61280702,
        image_url: "https://images.ygoprodeck.com/images/cards/61280702.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/61280702.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/61280702.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/nightmare-magician-14022",
    card_prices: [{ tcgplayer_price: "0.25", cardmarket_price: "0.20" }]
  },
  {
    id: 65305468,
    name: "Number F0: Utopic Future",
    type: "XYZ Monster",
    frameType: "xyz",
    desc: "2 Xyz Monsters with the same Rank, except \"Number\" monsters\n(This card's original Rank is always treated as 1.)\nCannot be destroyed by battle, and neither player takes any battle damage from attacks involving this card. At the end of the Damage Step, if this card battled an opponent's monster: You can take control of that opponent's monster until the end of the Battle Phase. If this face-up card on the field would be destroyed by card effect, you can detach 1 material from this card instead.",
    race: "Warrior",
    atk: 0,
    def: 0,
    level: 0,
    attribute: "LIGHT",
    archetype: "Utopia",
    card_images: [
      {
        id: 65305468,
        image_url: "https://images.ygoprodeck.com/images/cards/65305468.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/65305468.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/65305468.jpg"
      }
    ],
    ygoprodeck_url: "https://ygoprodeck.com/card/number-f0-utopic-future-5536",
    card_prices: [{ tcgplayer_price: "1.10", cardmarket_price: "0.95" }]
  },
  {
    id: 74677422,
    name: "Red-Eyes Black Dragon",
    type: "Normal Monster",
    frameType: "normal",
    desc: "A ferocious dragon with a deadly attack.",
    race: "Dragon",
    atk: 2400,
    def: 2000,
    level: 7,
    attribute: "DARK",
    archetype: "Red-Eyes",
    card_images: [
      {
        id: 74677422,
        image_url: "https://images.ygoprodeck.com/images/cards/74677422.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/74677422.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/74677422.jpg"
      }
    ]
  },
  {
    id: 27288416,
    name: "Nibiru, the Primal Being",
    type: "Effect Monster",
    frameType: "effect",
    desc: "During the Main Phase, if your opponent Normal or Special Summoned 5 or more monsters this turn (Quick Effect): You can Tribute as many face-up monsters on the field as possible, and if you do, Special Summon this card from your hand, then Special Summon 1 \"Primal Being Token\" (Rock/LIGHT/Level 11/ATK ?/DEF ?) to your opponent's field. (This Token's ATK/DEF become the combined original ATK/DEF of the Tributed monsters.) You can only use this effect of \"Nibiru, the Primal Being\" once per turn.",
    race: "Rock",
    atk: 3000,
    def: 600,
    level: 11,
    attribute: "LIGHT",
    card_images: [
      {
        id: 27288416,
        image_url: "https://images.ygoprodeck.com/images/cards/27288416.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/27288416.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/27288416.jpg"
      }
    ]
  },
  {
    id: 23434538,
    name: "Maxx \"C\"",
    type: "Effect Monster",
    frameType: "effect",
    desc: "During either player's turn: You can send this card from your hand to the Graveyard; this turn, each time your opponent Special Summons a monster(s), immediately draw 1 card. You can only use 1 \"Maxx \"C\"\" per turn.",
    race: "Insect",
    atk: 500,
    def: 200,
    level: 2,
    attribute: "EARTH",
    card_images: [
      {
        id: 23434538,
        image_url: "https://images.ygoprodeck.com/images/cards/23434538.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/23434538.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/23434538.jpg"
      }
    ],
    banlist_info: { ban_tcg: "Forbidden", ban_ocg: "Unlimited" }
  },
  {
    id: 63504681,
    name: "Red-Eyes Dark Dragoon",
    type: "Fusion Monster",
    frameType: "fusion",
    desc: "\"Dark Magician\" + \"Red-Eyes Black Dragon\" or 1 Dragon Effect Monster\nCannot be destroyed by card effects. Neither player can target this card with card effects. During your Main Phase: You can destroy 1 monster your opponent controls, and if you do, inflict damage to your opponent equal to that monster's original ATK. You can use this effect up to the number of Normal Monsters used as Fusion Material for this card per turn. Once per turn, when a card or effect is activated (Quick Effect): You can discard 1 card; negate the activation, and if you do, destroy that card, and if you do that, this card gains 1000 ATK.",
    race: "Spellcaster",
    atk: 3000,
    def: 2500,
    level: 8,
    attribute: "DARK",
    archetype: "Dark Magician",
    card_images: [
      {
        id: 63504681,
        image_url: "https://images.ygoprodeck.com/images/cards/63504681.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/63504681.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/63504681.jpg"
      }
    ]
  },
  {
    id: 53183600,
    name: "Blue-Eyes Toon Dragon",
    type: "Toon Monster",
    frameType: "effect",
    desc: "Cannot be Normal Summoned/Set. Must first be Special Summoned (from your hand) by Tributing 2 monsters, while you control \"Toon World\". Cannot attack the turn it is Special Summoned. You must pay 500 LP to declare an attack with this monster. If \"Toon World\" on the field is destroyed, destroy this card. Can attack your opponent directly, unless they control a Toon monster, in which case this card must target a Toon monster for its attacks.",
    race: "Dragon",
    atk: 3000,
    def: 2500,
    level: 8,
    attribute: "LIGHT",
    archetype: "Toon",
    card_images: [
      {
        id: 53183600,
        image_url: "https://images.ygoprodeck.com/images/cards/53183600.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/53183600.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/53183600.jpg"
      }
    ]
  },
  {
    id: 53842431,
    name: "Gigaplant",
    type: "Gemini Monster",
    frameType: "effect",
    desc: "This card is treated as a Normal Monster while face-up on the field or in the GY. While this card is a Normal Monster on the field, you can Normal Summon it to have it become an Effect Monster with this effect.\n● Once per turn: You can Special Summon 1 Insect or Plant monster from your hand or GY.",
    race: "Plant",
    atk: 2400,
    def: 1200,
    level: 6,
    attribute: "EARTH",
    card_images: [
      {
        id: 53842431,
        image_url: "https://images.ygoprodeck.com/images/cards/53842431.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/53842431.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/53842431.jpg"
      }
    ]
  },
  {
    id: 77411244,
    name: "B-Buster Drake",
    type: "Union Effect Monster",
    frameType: "effect",
    desc: "Once per turn, you can either: Target 1 Machine monster you control; equip this card to that target, OR: Unequip this card and Special Summon it. A monster equipped with this card is unaffected by your opponent's Spell effects, also if the equipped monster would be destroyed by battle or card effect, destroy this card instead. If this card is sent from the field to the GY: You can add 1 Union monster from your Deck to your hand.",
    race: "Machine",
    atk: 1500,
    def: 1800,
    level: 4,
    attribute: "LIGHT",
    archetype: "A-to-Z",
    card_images: [
      {
        id: 77411244,
        image_url: "https://images.ygoprodeck.com/images/cards/77411244.jpg",
        image_url_small: "https://images.ygoprodeck.com/images/cards_small/77411244.jpg",
        image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/77411244.jpg"
      }
    ]
  }
];

export const META_RESOURCES: MetaResource[] = [
  {
    id: "masterduelmeta",
    title: "Master Duel Meta",
    url: "https://www.masterduelmeta.com",
    category: "meta",
    categoryLabel: "Competitive Meta",
    description: "The premier competitive guide for Yu-Gi-Oh! Master Duel. Features daily tournament decklists, top cut breakdown, dynamic tier lists, secret pack breakdowns, and gem investment recommendations.",
    highlights: ["Live Master Duel Tier List", "Top Tournament Decks", "Gem & Crafting Guides", "Leak & Datamine Reports"],
    recommendedFor: "Master Duel players seeking the optimal ladder decks and meta counter-strategies.",
    badge: "Official MD Community Hub"
  },
  {
    id: "yugiohmeta",
    title: "Yu-Gi-Oh! Meta",
    url: "https://www.yugiohmeta.com",
    category: "meta",
    categoryLabel: "Competitive Meta",
    description: "Comprehensive competitive data tracker for the physical Yu-Gi-Oh! Trading Card Game (TCG). Analyzes YCS results, Regional Championships, tier rankings, and regional metagame shifts.",
    highlights: ["TCG Tournament Tier Lists", "YCS & Regional Top Cut Decks", "Side Deck Tech Trends", "Banlist Impact Studies"],
    recommendedFor: "Competitive TCG duelists preparing for local tournaments, regionals, or YCS main events.",
    badge: "TCG Competitive Focus"
  },
  {
    id: "ygoprodeck",
    title: "YGOPRODeck",
    url: "https://ygoprodeck.com",
    category: "database",
    categoryLabel: "Database & Decks",
    description: "The world's largest online Yu-Gi-Oh! deck repository, tournament deck builder, and card price intelligence engine. Features advanced probability test hands and pricing from TCGplayer and Cardmarket.",
    highlights: ["Over 100,000+ Community Decks", "Interactive Test Hand Simulator", "Live Card Pricing Analytics", "Deck Export to EDOPro / Master Duel"],
    recommendedFor: "Duelists crafting new archetype decks, testing opening hands, and checking market pricing.",
    badge: "API Data Provider"
  },
  {
    id: "yugioh-card-db",
    title: "Konami Official Card Database",
    url: "https://www.db.yugioh-card.com",
    category: "database",
    categoryLabel: "Database & Decks",
    description: "Konami's authoritative, official card database. Provides definitive legal card texts, errata histories, detailed official judge rulings, and sanctioned tournament forbidden/limited lists.",
    highlights: ["Authoritative Konami Card Texts", "Official Judge QA Database", "Tournament Sanctioned Banlists", "Card Errata Histories"],
    recommendedFor: "Judges, tournament organizers, and duelists verifying exact legal rulings and interaction timings."
  },
  {
    id: "yugipedia",
    title: "Yugipedia",
    url: "https://yugipedia.com",
    category: "database",
    categoryLabel: "Database & Decks",
    description: "The free, highly detailed, community-led encyclopedia for all things Yu-Gi-Oh! Details every card release, set rarities, anime lore, manga origins, and OCG vs TCG release differences.",
    highlights: ["Comprehensive Release Sets & Rarities", "OCG vs TCG Errata Comparisons", "Anime & Manga Lore", "Card Trivia & Art Variations"],
    recommendedFor: "Collectors, lore enthusiasts, and format historians."
  },
  {
    id: "duelingnexus",
    title: "Dueling Nexus",
    url: "https://duelingnexus.com",
    category: "simulator",
    categoryLabel: "Simulators & Tools",
    description: "Instant, free, browser-based automated Yu-Gi-Oh! simulator. No software downloads or installations needed. Features automated rules enforcement, ranked matchmaking, and solo practice bot duels.",
    highlights: ["Zero Installation Required", "Automated Rule Engine", "Ranked & Casual Matchmaking", "Custom Solo AI Bot Opponents"],
    recommendedFor: "Players wanting to test quick matches directly in their browser without downloading clients."
  },
  {
    id: "duelingbook",
    title: "DuelingBook",
    url: "https://www.duelingbook.com",
    category: "simulator",
    categoryLabel: "Simulators & Tools",
    description: "The premier manual browser simulator designed to mirror real physical tabletop play. Features custom card creation, live call-a-judge system, and high-stakes rated ladders used by top pro players.",
    highlights: ["Manual Realistic Dueling Engine", "Real-Time Judge Ruling Chat", "Competitive Pro Rated Ladder", "Custom Card Maker"],
    recommendedFor: "Competitive duelists practicing for real-life table events where manual card handling matters."
  },
  {
    id: "roadoftheking",
    title: "Road of the King",
    url: "https://roadoftheking.com",
    category: "news",
    categoryLabel: "News & Community",
    description: "World-renowned tactical analysis of the Japanese and Asian OCG competitive scene. Publishes weekly metagame pie charts, tournament breakdowns, deck archetype builds, and emerging strategies months ahead of the TCG.",
    highlights: ["Weekly OCG Metagame Reports", "Asian Championship Coverage", "Early Archetype Previews", "In-depth Tactical Strategy Articles"],
    recommendedFor: "Forward-thinking players seeking early warning on upcoming meta decks before they arrive in the TCG."
  },
  {
    id: "ygorganization",
    title: "YGOrganization",
    url: "https://ygorganization.com",
    category: "news",
    categoryLabel: "News & Community",
    description: "The foremost news source for Yu-Gi-Oh! breaking leaks, translation of new Japanese cards from V Jump, official product announcements, and high-level card rulings explanation.",
    highlights: ["Instant Japanese Card Translations", "Product Release Calendars", "V Jump Spoilers & Reveals", "Tournament Coverage"],
    recommendedFor: "Fans wanting up-to-the-minute news on brand new set spoilers and OCG revelations."
  },
  {
    id: "project-ignis",
    title: "Project Ignis (EDOPro)",
    url: "https://project-ignis.github.io",
    category: "simulator",
    categoryLabel: "Simulators & Tools",
    description: "The gold standard downloadable automated duel simulator. Ultra-fast, highly customizable, supports custom cards, puzzle duels, and supports all historical card formats (Goat, Edison, HAT).",
    highlights: ["High-Performance Native Client", "Historical Formats (Goat, Edison)", "Puzzle Duels & Custom Card Support", "Direct YGOPRODeck Deck Import"],
    recommendedFor: "Players seeking the smoothest offline and online dueling engine on desktop."
  },
  {
    id: "duellinksmeta",
    title: "Duel Links Meta",
    url: "https://www.duellinksmeta.com",
    category: "meta",
    categoryLabel: "Competitive Meta",
    description: "The authoritative strategy site for Yu-Gi-Oh! Duel Links. Maintained by tournament champions, featuring King of Games (KoG) decklists, character skill guides, and box appraisals.",
    highlights: ["Duel Links Tier Lists", "King of Games Deck Repository", "Skill Analysis & Farming Guides", "Box EV & Investment Reviews"],
    recommendedFor: "Speed Duel and Duel Links mobile and PC players."
  },
  {
    id: "reddit-yugioh",
    title: "r/yugioh Community",
    url: "https://www.reddit.com/r/yugioh",
    category: "news",
    categoryLabel: "News & Community",
    description: "The central global subreddit for duelists. Discussions cover meta shifts, ruling questions, custom card creations, tournament watch parties, and player trade/collection advice.",
    highlights: ["Active 600k+ Member Community", "Weekly Ruling Question Megathreads", "Community Deck Help & Critiques", "Event Live Discussion Threads"],
    recommendedFor: "Engaging in discussions, asking deck advice, and participating in the wider global player base."
  }
];

export const INITIAL_START_CARD: YugiohCard =
  INITIAL_ACE_CARDS[Math.floor(Math.random() * INITIAL_ACE_CARDS.length)];

