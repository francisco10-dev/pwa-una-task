const token = localStorage.getItem("token");
const Authorization=`Bearer ${token}`;
const urlAPI="https://una-task-api.onrender.com/graphql"

const createTask=async (name,deadline,capture)=>{
    const query=`
        mutation($input: NewTaskInput!) {
            createTask(input: $input) {
            id
            name
            deadline
            created_at
            }
        }      
    `;
    const input={
        name,
        deadline,
        capture
    };
    return await fetchAPI(query,input);
}

const getTasks= async (limit)=>{
    const query=`
        query{
            tasks {
                items {                    
                    deadline
                    id
                    name                    
                }
            }
        }
    `;
    const input={
        limit
    };
    return await fetchAPI(query,input);
}
const fetchAPI=async (query,input)=>{
    const options={
        method:'POST',
        headers:{
            'Content-Type':'application/json',
            Authorization
        },
        body: JSON.stringify({
            query,
            variables:{
                input
            }
        })
    };
    const result=await fetch(urlAPI,options);
    const data= await result.json();
    console.log(data);
    return data;
}