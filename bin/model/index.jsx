import Rimax, { render, useState } from "./dist/rimax.es.min.js";
const [count, setCount] = useState(0);
const el = (
  <>
    <h1>salu Rolio count: {count} </h1>
    <button onClick={() => setCount(count + 1)}>incrementer</button>
  </>
);

render(el, document.querySelector("#App"));
