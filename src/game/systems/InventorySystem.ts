import { soundEngine } from '../audio/SoundSystem';

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: {
    rags?: number;
    alcohol?: number;
    blades?: number;
    tape?: number;
    scrap?: number;
  };
  output: {
    type: 'medkit' | 'hone' | 'smoke' | 'bottle';
    amount: number;
  };
}

export interface InventorySupplies {
  rags: number;
  alcohol: number;
  blades: number;
  tape: number;
  scrap: number;
  medkits: number;
  bottles: number;
  smokeBombs: number;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_medkit',
    name: 'Botiquín de Primeros Auxilios',
    description: 'Vendas esterilizadas con alcohol. Cura heridas graves y detiene hemorragias.',
    icon: 'bandage',
    cost: { rags: 1, alcohol: 1 },
    output: { type: 'medkit', amount: 1 },
  },
  {
    id: 'craft_hone',
    name: 'Afilador de Cuchillo',
    description: 'Restaura el filo y la durabilidad del cuchillo de Dina.',
    icon: 'sword',
    cost: { blades: 1, tape: 1 },
    output: { type: 'hone', amount: 1 },
  },
  {
    id: 'craft_smoke',
    name: 'Bomba de Humo Artesanal',
    description: 'Crea una nube densa para cegar infectados y escapar.',
    icon: 'cloud',
    cost: { scrap: 2, alcohol: 1 },
    output: { type: 'smoke', amount: 1 },
  },
];

export class InventorySystem {
  public supplies: InventorySupplies = {
    rags: 1,
    alcohol: 1,
    blades: 1,
    tape: 1,
    scrap: 3,
    medkits: 1,
    bottles: 2,
    smokeBombs: 0,
  };

  public collectedNotes: {
    id: string;
    title: string;
    date: string;
    author: string;
    content: string;
  }[] = [];

  public canCraft(recipe: CraftingRecipe): boolean {
    for (const [key, req] of Object.entries(recipe.cost)) {
      const supplyKey = key as keyof InventorySupplies;
      if ((this.supplies[supplyKey] || 0) < (req || 0)) {
        return false;
      }
    }
    return true;
  }

  public craft(recipe: CraftingRecipe): boolean {
    if (!this.canCraft(recipe)) return false;

    // Deduct cost
    for (const [key, req] of Object.entries(recipe.cost)) {
      const supplyKey = key as keyof InventorySupplies;
      this.supplies[supplyKey] -= req || 0;
    }

    // Add output
    if (recipe.output.type === 'medkit') {
      this.supplies.medkits += recipe.output.amount;
    } else if (recipe.output.type === 'smoke') {
      this.supplies.smokeBombs += recipe.output.amount;
    }

    soundEngine.playCraft();
    return true;
  }

  public addSupplies(loot: Partial<InventorySupplies>) {
    for (const [key, amount] of Object.entries(loot)) {
      const supplyKey = key as keyof InventorySupplies;
      this.supplies[supplyKey] = (this.supplies[supplyKey] || 0) + (amount || 0);
    }
    soundEngine.playLoot();
  }

  public addNote(note: { id: string; title: string; date: string; author: string; content: string }) {
    if (!this.collectedNotes.some((n) => n.id === note.id)) {
      this.collectedNotes.push(note);
      soundEngine.playLoot();
    }
  }

  public saveGame(slotKey = 'tlou3_savegame'): boolean {
    try {
      const data = {
        supplies: this.supplies,
        collectedNotes: this.collectedNotes,
        timestamp: Date.now(),
      };
      localStorage.setItem(slotKey, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  public loadGame(slotKey = 'tlou3_savegame'): boolean {
    try {
      const raw = localStorage.getItem(slotKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.supplies) this.supplies = data.supplies;
      if (data.collectedNotes) this.collectedNotes = data.collectedNotes;
      return true;
    } catch {
      return false;
    }
  }
}
