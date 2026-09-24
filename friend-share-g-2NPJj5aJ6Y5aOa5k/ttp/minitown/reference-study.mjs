import {newTown,placeBlock} from './simulation.mjs';
// Same visible scenario as the live reference captured 2026-09-18: three joined tier-2 homes, dawn 05:12.
export function referenceTown(grown=false){const t=newTown();t.time=1440+5*60+12;const b=placeBlock(t,'home',[[3,5],[4,5],[5,5]]);b.born=t.time-800;b.seed=320;b.style='reference';if(grown)t.time=2*1440+11*60+54;return t;}

// A replayable morning for observing automatic connecting roads and commuting.
export function commuteTown(){const t=referenceTown(true);t.time=8*1440+7*60+50;t.blocks[0].born=t.time-3000;const b=placeBlock(t,'work',[[3,2]]);b.born=t.time-3000;b.style='reference';return t;}
