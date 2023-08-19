const operators = {
  price: {
    gte: 5,
  },
  rating: {
    lte: 4,
  },
};
const options = ["gte", "lte", "lt", "gt"];
for (const key in operators) {
  const op = Object.keys(operators[key])[0];
  if (options.includes(op)) {
    operators[key][`$${op}`] = operators[key][op];
    delete operators[key][op];
  }
}
console.log(operators);

// console.log(entires);
