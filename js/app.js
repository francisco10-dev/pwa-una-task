let url=window.location.href;
let swLoc="unatask/service-worker.js";
if(navigator.serviceWorker){
    if(url.includes('localhost') || url.includes('127.0.0.1')){
        swLoc='/service-worker.js';
    }
    navigator.serviceWorker.register(swLoc)
        .then(reg=>{
            // setTimeout(()=>{
            //     reg.sync.register('post-new-user');
            //     console.log("Se envió la información al servidor");
            // },3000);
        });
}
const modalContainer=document.getElementById("modal-container")
const addBtn=document.getElementById("add-task-button")

addBtn.addEventListener("click",()=>{
    createModal(`
        <div class="container mt-5">
            <h2 class="mb-4">Nueva tarea</h2>
            <form id="new-task-form">
                <div class="mb-3">
                    <label for="nombre-tarea" class="form-label">Nombre de la tarea</label>
                    <input type="text" class="form-control" id="nombre-tarea" name="nombre-tarea" required/>
                </div>
                <div class="mb-3">
                    <label for="fecha-finalizacion" class="form-label">Fecha de finalización</label>
                    <input type="date" class="form-control" id="fecha-finalizacion" name="fecha-finalizacion" required/>
                </div>
                <div class="mb-3">
                    <label for="imagen" class="form-label">Captura de imagen</label>
                    <input type="file" class="form-control" id="imagen" name="imagen"/>
                </div>

                <button type="submit" id="btn-save" class="btn btn-primary" >Guardar</button>
            </form>
        </div>
    `)
})

const createModal=(content="")=>{
    modalContainer.innerHTML=`
        <div class="modal" id="modal">
            <div class="modal-content modal-transform">
                ${content}
                <button id="btn-close-modal" class="modal-btn-closed">x</button>
            </div>
        </div>
    `;
    const deleteModal=()=>{
        modalContainer.innerHTML=""
    }
    document.getElementById("modal").addEventListener("click",(e)=>{
        if(e.target.id==="btn-close-modal"){
            deleteModal()
        }
    })
    const form=document.getElementById("new-task-form");
    form.addEventListener("submit",saveTask);
    
    function saveTask(event){
        event.preventDefault();
        const data=new FormData(event.target);
        const name=data.get("nombre-tarea");
        const deadline=data.get("fecha-finalizacion");
        const capture=null;
        console.log(name);
        createTask(name,deadline,capture);
        deleteModal();
        alert("Tarea creada")
    }
}

window.onload=(e)=>{
    //Metodo que verifique el token
    //Si existe el token, cargamos las tareas
    //Si no exite, debemos crear un modal (sin que cierre) solicitando el inicio de sesión 
    console.log(getTasks());
}
