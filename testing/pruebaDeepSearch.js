function getValueFromPath(object, path) {
  let o = path.split(".");
  if (object === null) return null;
  if (object === undefined) return undefined;
  if (o.length === 1) {
    return object[path];
  } else {
    return getValueFromPath(object[o[0]], o.slice(1).join("."));
  }
}

let x = {
  value: 1,
  deep: {
    value: 2,
    deep: {
      value: 3,
    },
  },
};
let path = "deep.value";
getValueFromPath(x, deep);
