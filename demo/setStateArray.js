import { html, useState } from "../rcdom/index.js"
export function testStateArray() {
    const randInt = () => Math.round((Math.random()) * 10)
    const [list, setList] = useState([randInt(), randInt()])
    const [value, setValue] = useState(randInt())
    const [ListValue, setListValue] = useState([randInt(), randInt(), randInt()])

    const getValue = () => {
        const v = value.value
        setValue(randInt())
        return v
    }
    const getListValue = () => {
        const v = ListValue.value
        setListValue([randInt(), randInt(), randInt()])
        return v
    }
    list.onChange((v)=>{
        console.log(v);
    },true)
    const [v]=useState(list.get(l => JSON.stringify(l)))
    v.onChange((va)=>{
        console.log(va);
    },true)
    return html`
   value :${value} <br>
   listValue:[${ListValue.get(l => l.join(', '))}]
   <br>
   list : ${list.get(l => JSON.stringify(l))}
   
   <ul >
       <button onClick=${() => setList([])} >CLEAR</button><br>
       [
           <button onClick=${() => setList.unshift(getValue())} >unshift(${value})</button>
       
           <button onClick=${() => setList.unshift(...getListValue())} >unshift-list([${ListValue.get(l => l.join(', '))}])</button>
       ]
       [
           <button onClick=${() => setList.shift()} >shift()</button>
       ]<br>
       [
           <button onClick=${() => setList.push(getValue())} >push(${value})</button>
       
           <button onClick=${() => setList.push(...getListValue())} >push-list([${ListValue.get(l => l.join(', '))}])</button>
       ]
       [
           <button onClick=${() => setList.pop()} >pop()</button>
       ]
       <br>
       [
           <button onClick=${() => setList.splice(1)} >splice(1)</button>
           <button onClick=${() => setList.splice(1, 0, getValue())} >splice(1,0,${value})</button>
           <button onClick=${() => setList.splice(1, undefined, 5)} >splice(1,undefined,5)</button>
           <button onClick=${() => setList.splice(1, undefined, undefined)} >splice(1,undefined,undefined)</button>
           <button onClick=${() => setList.splice(1, 1)} >splice(1,1)</button>
           <button onClick=${() => setList.splice(1, 1, 2)} >splice(1,1,2)</button>
           <button onClick=${() => setList.splice(1, 1, getValue())} >splice(1,1,${value})</button>
           <button onClick=${() => setList.splice(1, 1, ...getListValue())} >splice(1,1,...[${ListValue.get(l => l.join(', '))}])</button>
       ]
       <br>
       [
           <button onClick=${() => setList.reverse()} >reverse</button>
       ]
       <br>
       [
           <button onClick=${() => setList.fill(10)} >fill(10)</button>
           <button onClick=${() => setList.fill(20, 2)} >fill(20,2)</button>
           <button onClick=${() => setList.fill(20, 2, 5)} >fill(20,2,5)</button>
           <button onClick=${() => setList.fill(20, 2, 5)} >fill(20,5,2)</button>
           <button onClick=${() => setList.fill(getValue())} >fill(${value})</button>
           <button onClick=${() => setList.fill(getValue(), 3)} >fill(${value},3)</button>
           <button onClick=${() => setList.fill(getValue(), 3, 5)} >fill(${value},3,5)</button>
       ]
       <br>
       [
           <button onClick=${() => setList.filter((v) => v < 5)} >filter(infer-5)</button>
           <button onClick=${() => setList.filter((v) => v > 5)} >filter(super-5)</button>
           <button onClick=${() => setList.filter((v) => v == 5)} >filter(egal-5)</button>
       ]
       <br>
       [
           <button onClick=${() => setList.slice(0)} >slice(0)</button>
           <button onClick=${() => setList.slice(1)} >slice(1)</button>
           <button onClick=${() => setList.slice(2, 4)} >slice(2,4)</button>
       ]
       <br>
       [
           <button onClick=${() => setList.sort()} >sort()</button>
           <button onClick=${() => setList.sort((a, b) => a - b)} >sort(croissant)</button>
           <button onClick=${() => setList.sort((a, b) => b - a)} >sort(decroissant)</button>
       ]
       <br>
       ${list.get(l => l.map(item => html`<li>${item}</li>`))}
   
   </ul>
   <div class="active" class="active-2 ${value} " class=${ListValue}  >
       salu Rolio
   </div>
   `
}
testStateArray.defaultProps={}