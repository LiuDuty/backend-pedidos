const appId = 'qMwcFKLqhylXNbQghvjtz5zxYO63xlyCzqxOo5lD';
const restKey = '4WY8NtONsoc4VemoMrpcRMvrxwAacy01CFn5Cy2C';

const data = {
    name: "A string",
    price: 1,
    color: "A string"
};

async function postToB4A() {
    try {
        const response = await fetch('https://parseapi.back4app.com/classes/B4aVehicle', {
            method: 'POST',
            headers: {
                'X-Parse-Application-Id': appId,
                'X-Parse-REST-API-Key': restKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

postToB4A();
