import { html, useState } from "../rcdom/index.js"

export default function Pagination({ children }) {
    const [items, setItems] = useState(children)
    const [indexSelected, selectIndex] = useState(0)
    indexSelected.onChange((value) => {
        if (value >= items.value.length) {
            return selectIndex(items.value.length - 1)
        }
        if (0 > value) return selectIndex(0)
        return value
    })
    const list = items.get.map((item, index) =>
        html`<li>
    <a href="#" class="red" onClick=${()=> selectIndex(index)}
        class="${indexSelected.get(i => i === index.value ? "active" : "")}" >
        ${item}
    </a>
</li>
`)
    return html`
    <div $shadowRoot>
        <link rel="stylesheet" href="demo/pagination.style.css" type="text/css">
        <ul>
            <li><a href="#" style="border-radius:20px 0 0 20px;" onClick=${()=> selectIndex(indexSelected - 1)} >
                    <${indexSelected}</a> </li> ${list} <li><a href="#" style="border-radius:0 20px 20px 0;" onClick=${()=>
                            selectIndex(indexSelected + 1)} >></a></li>
        </ul>
    </div>
    `
}