const y = {
  name: "Ruslan",
  age: 18,
  birthYear: 2004,
};

const z = (object) => {
  object.push(1);

  return object;
};

const x = function (object) {
  const newObject = z([...object]);

  console.log(newObject);
  console.log(object);
};

x([5]);
