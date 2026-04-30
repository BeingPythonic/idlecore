import { Engine, resourceSystem } from "idlecore";

const engine = new Engine({
  resources: {
    gold: {
      amount: 0,
      rate: 2,
    },
    stone: {
      amount: 5,
      rate: 1,
    },
  },
});

engine.registerSystem(resourceSystem);
engine.simulate(10, 2);

console.log("Idlecore integration example");
console.log(`gold: ${engine.state.resources.gold.amount}`);
console.log(`stone: ${engine.state.resources.stone.amount}`);
