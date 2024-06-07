let url=window.location.href;
let swLoc="/service-worker.js";
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
                <button class="modal-btn-close" id="btn-close-modal" >x</button>
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
    }
}
function notifications(){
    if(window.Notification){
        if(Notification.permission==='default'){
            Notification.requestPermission((permission)=>{
                console.log(permission)
            })
        }
    }
}

function handleAccess(){
    const token = localStorage.getItem("token");
    const mainContent = document.getElementById("main-content");
    const loginBox = document.getElementById("login");
    const loginForm = document.getElementById("login-form");
    loginBox.style.display = 'none';

    if(!token){
        mainContent.style.display = 'none';
        loginBox.style.display = 'flex';
        loginForm.addEventListener("submit", login);
    }

    async function login(event) {
        event.preventDefault();
        const data = new FormData(event.target);
        const email = data.get("email");
        const password = data.get("password");
        const json = {
            email: email, 
            password, password
        }
        const response = await fetchLogin(json);
        if(response.status === 200){
            const result = await response.json();
            localStorage.setItem("token", result.token);
            loginBox.style.display = 'none';
            mainContent.style.display = "flex";
        }else if(response.status === 401){
            alert("Credenciales incorrectas");
        }
    }    
}

window.onload=(e)=>{
    //Metodo que verifique el token
    //Si existe el token, cargamos las tareas
    //Si no exite, debemos crear un modal (sin que cierre) solicitando el inicio de sesión     
    console.log(getTasks());
    handleAccess();
    notifications();
    //llamar al metodo de subcripción
    newTaskSubscription();

}
