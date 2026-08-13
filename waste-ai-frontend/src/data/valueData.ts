export interface ValueIdea {
  label: string;
  reuseIdeas: string[];
  recycleIdeas: string[];
  transformIdeas: string[];
  businessIdea: string;
  usefulnessScore: number;
  ecoScore: number;
  recyclableScore: number;
  commercialScore: number;
  environmentalStats: {
    treesSaved?: string;
    waterSaved?: string;
    landfillReduction?: string;
    carbonCut?: string;
  };
}

export const VALUE_MAP: Record<string, ValueIdea> = {
  paper: {
    label: 'Paper',
    reuseIdeas: [
      'Rough notes and sketching',
      'Gift wrapping material',
      'Packing fragile items',
      'Origami and craft projects',
      'Drawer and shelf liners',
    ],
    recycleIdeas: [
      'Send to local recycling center',
      'Convert into new paper products',
      'Industrial pulping process',
      'Composting for organic breakdown',
    ],
    transformIdeas: [
      'Biodegradable eco-packaging',
      'Paper pulp composite boards',
      'Plantable seed paper',
      'Cellulose insulation material',
    ],
    businessIdea: 'Launch a boutique handmade recycled notebook and seed paper business.',
    usefulnessScore: 85,
    ecoScore: 90,
    recyclableScore: 100,
    commercialScore: 70,
    environmentalStats: {
      treesSaved: '17 trees per ton',
      waterSaved: '7,000 gallons per ton',
      landfillReduction: '3.3 cubic yards per ton',
      carbonCut: '4,000 lbs CO2 per ton',
    },
  },
  plastic: {
    label: 'Plastic',
    reuseIdeas: [
      'Plant pots for indoor gardening',
      'Storage containers for hardware',
      'DIY desk organizers',
      'Watering bottle for plants',
      'Upcycled decor items',
    ],
    recycleIdeas: [
      'Send to specialized plastic sorting facility',
      'Convert into synthetic textile fibers',
      'Industrial pelletizing process',
      'Material separation and reforming',
    ],
    transformIdeas: [
      'Durable Eco-bricks for construction',
      'Recycled 3D printing filament',
      'Synthetic furniture boards',
      'Road construction asphalt additive',
    ],
    businessIdea: 'Create premium vertical garden products from transformed waste bottles.',
    usefulnessScore: 70,
    ecoScore: 50,
    recyclableScore: 85,
    commercialScore: 90,
    environmentalStats: {
      waterSaved: '16.3 barrels of oil per ton',
      landfillReduction: '7.4 cubic yards per ton',
      carbonCut: '1.5 tons CO2 per ton',
    },
  },
  metal: {
    label: 'Metal',
    reuseIdeas: [
      'Tool and hardware holder',
      'Storage tins for kitchen pantry',
      'Artistic metal crafts and sculptures',
      'Planters for succulents',
    ],
    recycleIdeas: [
      'Sell to local scrap metal yards',
      'Melt down into raw aluminum/steel',
      'Industrial purification process',
      'Magnetized sorting process',
    ],
    transformIdeas: [
      'Melt into durable hand tools',
      'Automotive replacement parts',
      'Structural beams for micro-housing',
      'Industrial grade components',
    ],
    businessIdea: 'Source and sell sorted scrap metal directly to fabrication workshops and foundries.',
    usefulnessScore: 95,
    ecoScore: 85,
    recyclableScore: 100,
    commercialScore: 95,
    environmentalStats: {
      waterSaved: '100% infinitely recyclable',
      landfillReduction: 'Massive volume reduction',
      carbonCut: '95% less energy than raw ore',
    },
  },
  glass: {
    label: 'Glass',
    reuseIdeas: [
      'Pantry food storage jars',
      'Vases for fresh flowers',
      'DIY terrariums',
      'Candle holders',
      'Drinking glasses',
    ],
    recycleIdeas: [
      'Color-sorted glass recycling plant',
      'Crushed into cullet for manufacturing',
      'Fiberglass insulation production',
    ],
    transformIdeas: [
      'Decorative glass tiling',
      'Sand substitute for beach restoration',
      'Water filtration media',
      'Abrasive blasting material',
    ],
    businessIdea: 'Create custom upcycled glassware and luxury eco-friendly candles.',
    usefulnessScore: 90,
    ecoScore: 95,
    recyclableScore: 100,
    commercialScore: 60,
    environmentalStats: {
      treesSaved: 'Replaces raw sand mining',
      waterSaved: 'Zero water degradation',
      landfillReduction: 'Prevents million-year decay',
      carbonCut: '315kg CO2 per ton',
    },
  },
  cardboard: {
    label: 'Cardboard',
    reuseIdeas: [
      'Moving and storage boxes',
      'Weed barrier for gardening',
      'Cat scratching posts',
      'Playhouses for children',
      'Painting drop cloths',
    ],
    recycleIdeas: [
      'Curbside cardboard recycling',
      'Commercial baling and pulping',
      'Compost carbon ingredient',
    ],
    transformIdeas: [
      'Corrugated acoustic paneling',
      'Biodegradable coffin manufacturing',
      'Eco-friendly furniture design',
      'Pelletized heating fuel',
    ],
    businessIdea: 'Design and sell modern, minimalist furniture entirely out of engineered recycled cardboard.',
    usefulnessScore: 80,
    ecoScore: 90,
    recyclableScore: 100,
    commercialScore: 75,
    environmentalStats: {
      treesSaved: '17 trees per ton',
      waterSaved: '7,000 gallons per ton',
      landfillReduction: '9 cubic yards per ton',
      carbonCut: '46 gallons of oil per ton',
    },
  },
  trash: {
    label: 'General Trash',
    reuseIdeas: [
      'Assess if items can be individually salvaged',
      'Identify reusable mixed-material parts',
    ],
    recycleIdeas: [
      'Send to advanced material recovery facility (MRF)',
      'Waste-to-energy incineration',
    ],
    transformIdeas: [
      'Methane capture from decomposition',
      'Compacted landfill stabilization',
      'Slag generation for aggregate',
    ],
    businessIdea: 'Provide intelligent waste sorting and separation consultancy for local businesses.',
    usefulnessScore: 20,
    ecoScore: 10,
    recyclableScore: 15,
    commercialScore: 30,
    environmentalStats: {
      landfillReduction: 'Target zero-waste initiatives',
      carbonCut: 'Methane capture potential',
    },
  },
};
