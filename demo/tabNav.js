import { html,RcHtmlElement,useState } from "../rcdom/index.js";

export function Tabs({select,children}) {
    console.log(children);
    const [selected,choose]=useState(select??children[0]?.props?.key??"")
    const titles=children.map(child=>{
        if(!(child instanceof RcHtmlElement)) return
        if(!child.props.title) return
        child.props.selected=selected
        child.props.$if=selected.get(s=>s===child.props.key)
        return html`<a href="#" onclick=${()=>choose(child.props.key)} >${child.props.title}</a>`
    })
    return html`
    <div>
        <nav>
            ${titles}
        </nav>
        <section>
            ${children}
        </section>
    </div>
    `
}