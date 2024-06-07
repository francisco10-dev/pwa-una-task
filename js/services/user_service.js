const fetchLogin = async (data)=> {
    try {
        console.log(data);
        const response = await fetch('https://una-task-api.onrender.com/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response;
    } catch (error) {
        console.log(error);
    }
}

