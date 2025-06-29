
import Admin from './models/admin.js';

const nom = "Admin"
const prenom="admin"
const email="admin@gmail.com"
const password="12345678"
try{
    const admin = await Admin.create(
        {
            nom,
            prenom,
            email,
            password
        }
    )
    console.log("succes");
    
}catch(err){
    console.log(err);
    
}