import { define, html, useState } from "../../Rmax/index.js";
import Month from "./Month.js";
const Calendrier=define("my-calendar",function Calendrier({ year}) {
    var [year] = useState(year)
    const months = year.get(y => Month.createMonthsForYear(y))
    return html`
    <div >
        <link rel="stylesheet" href="demo/Calendrier/style.css" type="text/css">
        <input type="number" value="${year}" /> ${year}
        <div class="rangepicker">
            ${html.map(months, (month) => {
            return html`
            <div class="rangepicker_month">
                <div class="rangepicker_monthtitle">${month.get(m => m.getName())}-${year}</div>
                <div class="rangepicker_days">
                    <div>Lun</div>
                    <div>Mar</div>
                    <div>Mer</div>
                    <div>Jeu</div>
                    <div>Ven</div>
                    <div>Sam</div>
                    <div>Dim</div>
                </div>
                <div class="rangepicker_numbers">
                    ${html.map(month.get(m => m.getDays()), day => html`
                    <div class="rangepicker_day" class="${day.get(d => classForDay(d, month.value))}">${day.get(d =>
                        d.getDate())}</div>
                    `)}
                </div>
            </div>
            `
            })}
        </div>
    </div>
    `
},{
    defaultProps:{
        year:2022
    },
    shadowRoot:true
})
export default Calendrier

function classForDay(day, month) {
    let classes = []
    if (!month.contains(day)) {
        classes.push("rangepicker_out")
    }
    return classes
}