import { render, html, useState } from "../Rimax/index.js"
// const {render, html, useState} =Rimax
const [todos, setTodos] = useState([
  { task: "Bfaire un", completed: false, date: new Date() },
  { task: "Afaire deux", completed: true, date: new Date() },
  { task: "Cfaire trois", completed: false, date:new  Date() },
], {
  actions: {
    add: (tds, task) => [...tds, { task, completed: false, date: new Date() }],
    toggle: (tds, tdo) => {
      const has = tds.findIndex(td => td === tdo)
      if (has > -1) {
        tds[has] = { ...tdo, completed: !tdo.completed }
        return [...tds]
      }
      return tds
    },
    delete: (tds, tdo) => {
      const has = tds.findIndex(td => td === tdo)
      if (has > -1) {
        tds.splice(has, 1)
        return [...tds]
      }
      return tds
    }
  }
})
const [tabSelected, changeTabSelected] = useState("All")

function TodoItemTask({ todo, index }) {
  const id = "todo-id-" + Date.now()
  const [isEdit, setIsEdit] = useState(tabSelected.get(t => false))
  const task = todo.get(t => t.task)
  task.onChange(t => {
    const tdo = todos.value
    const has = tdo.findIndex(td => td === todo.value)
    if (has > -1) {
      tdo[has] = { ...todo.value, task: t }
      setTodos([...tdo])
    }
  })
  return html`
    <li class="list-group-item d-flex align-items-center border-0 mb-2 rounded" style="background-color: #f4f6f7;">
      <div class="col-9"  >
        <input class="form-check-input me-2" type="checkbox" id=${id} onchange=${() => setTodos.toggle(todo.value)}
        checked=${todo.get(t => t.completed)} aria-label="..." />
        <label for=${id} $if:false=${isEdit}>
          ${index}:
          <span class=${todo.get(t=> t.completed ? "todo-item-completed" : "")}>${todo.get(t => t.task)}</span>
        </label>
        <textarea name="" id="" cols="60" rows="2" value=${task} $if=${isEdit}></textarea>
      </div>
      <div class="col-2">
        <div class="btn fs-4 border border-0" onclick=${()=> setIsEdit(is => !is)} >${isEdit.get(is => is ? "Save" : "✒️")}
        </div>
        <button class="btn btn-close" onClick=${()=> setTodos.delete(todo.value)} ></button>
      </div>
      <div class="col-1" style="font-size:11px">
        <span>${todo.get(t => t.date.toLocaleDateString())}</span><br>
        <span>${todo.get(t => t.date.toLocaleTimeString())}</span>
      </div>
    </li>
    `
}

export function TodoList() {
  const [newTodo, setNewTodo] = useState("")
  const [sortValue]=useState("date↓")
  const toggle = (tab) => {
    changeTabSelected(tab)
  }
  const todosFiltered = todos.get(t => {
    const filter=()=>{
      if (tabSelected.value == "Completed") return t.filter(td => td.completed)
      if (tabSelected.value == "Active") return t.filter(td => !td.completed)
      return [...t]
    }
    const sortByDate=(a,b)=>{
      if(a.date.getTime()>b.date.getTime()) return 1
        if(a.date.getTime()<b.date.getTime()) return -1
        return 0
    }
    const l=filter().sort((a,b)=>{
      if(sortValue.value=="date↑"){
        return sortByDate(a,b)
      }else if(sortValue.value=="date↓"){
        return sortByDate(b,a)
      }else if(sortValue.value=="a-z↓"){
        return a.task.localeCompare(b.task)
      }else if(sortValue.value=="a-z↑"){
        return b.task.localeCompare(a.task)
      }
      return 0
    })
    return l 
  }, [tabSelected,sortValue])
  return html`
    <style>
      .gradient-custom {
        background: radial-gradient(50% 123.47% at 50% 50%, #00ff94 0%, #720059 100%),
          linear-gradient(121.28deg, #669600 0%, #ff0000 100%),
          linear-gradient(360deg, #0029ff 0%, #8fff00 100%),
          radial-gradient(100% 164.72% at 100% 100%, #6100ff 0%, #00ff57 100%),
          radial-gradient(100% 148.07% at 0% 0%, #fff500 0%, #51d500 100%);
        background-blend-mode: screen, color-dodge, overlay, difference, normal;
    }
    .todo-item-completed{
      text-decoration-line:line-through;
    }
    </style>
    <section class="vh-100 gradient-custom">
      <div class="container py-5 h-100 " >
        <div class="row d-flex justify-content-center align-items-center ">
          <div class="col col-xl-10">
            <div class="card "  >
                <h1 class="text-center p-3">Todo-List</h1>
              <div class="card-body p-5" >
                <label class="form-label" for="form2">Nouveau tâche: ${newTodo}</label>
                <div class="d-flex justify-content-center align-items-center mb-4">
                  <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="nouveau tâche a faire..." value=${newTodo} aria-label="nouveau tâche a faire..." aria-describedby="button-addon2">
                <button class="btn btn-outline-secondary" type="button" id="button-addon2" onclick=${() =>setNewTodo("")} >Annuler</button>
                <button class="btn btn-outline-secondary" type="button" id="button-addon2" onclick=${() => {setTodos.add(newTodo.value);setNewTodo("")}} >Ajouter</button>
              </div>
              </div>
                <!-- Tabs navs -->
                <div class="row">
                <ul class="nav nav-tabs mb-4 pb-2 col-8" id="ex1" role="tablist">
                  <li class="nav-item" role="presentation" onclick=${() => toggle("All")} >
                    <a class="nav-link "class=${tabSelected.get(t => t == "All" ? "active" : "")} id="ex1-tab-1" data-mdb-toggle="tab" href="#ex1-tabs-1" role="tab"
                      aria-controls="ex1-tabs-1" aria-selected="true">All</a>
                  </li>
                  <li class="nav-item " role="presentation" onclick=${() => toggle("Active")}>
                    <a class="nav-link " class=${tabSelected.get(t => t == "Active" ? "active" : "")} id="ex1-tab-2" data-mdb-toggle="tab" href="#ex1-tabs-2" role="tab"
                      aria-controls="ex1-tabs-2" aria-selected="false">Active</a>
                  </li>
                  <li class="nav-item" role="presentation" onclick=${() => toggle("Completed")}>
                    <a class="nav-link" class=${tabSelected.get(t => t == "Completed" ? "active" : "")} id="ex1-tab-3" data-mdb-toggle="tab" href="#ex1-tabs-3" role="tab"
                      aria-controls="ex1-tabs-3" aria-selected="false">Completed</a>
                  </li>
                </ul>
              <div class="col-4">
              <select class="form-select form-select-sm" aria-label=".form-select-sm example" value=${sortValue} >
                <option  value="date↓">Date ↓</option>
                <option value="date↑">Date ↑</option>
                  <option selected value="a-z↓">A-z↓</option>
                  <option value="a-z↑">A-z↑</option>
                </select>
              </div>
                </div>
                <!-- Tabs navs -->

                <!-- Tabs content -->
                <div class="tab-content" id="ex1-content">
                  <div class="tab-pane fade show active" id="ex1-tabs-1" role="tabpanel"
                    aria-labelledby="ex1-tab-1">
                    <ul class="list-group mb-0 overflow-auto" style="height:300px">
                        ${html.map(todosFiltered, (todo, index) => TodoItemTask({ todo, index, }))}
                    </ul>
                  </div>
                </div>
                <!-- Tabs content -->

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
    `
}