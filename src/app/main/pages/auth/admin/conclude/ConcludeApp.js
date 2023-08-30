import React, { useContext, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AuthContext } from 'src/app/auth/AuthContext'

function ConcludeApp() {
    let { hash } = useParams()
    const {handleAdminLogin} = useContext(AuthContext)
    const [adminHashUsed, setAdminHashUsed] = useState(false)
    if(hash && !adminHashUsed){
        handleAdminLogin(hash)
        .then((response) => {
            console.log(response)
        })
        setAdminHashUsed(true)
    }

  return (
    <>

    



    </>
  )
}

export default ConcludeApp