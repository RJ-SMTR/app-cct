import { useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';

function ResumeApp() {
    const user = useSelector(selectUser);
    const fullName = user.fullName
    const [first] = fullName.split(' ');
  return (
    <>
          <div className="p-24 text-white bg-[#004A80] overflow">
              <h2 className='fw-black'>Bem vindo, {first}</h2>
              <p className='w-[100%] md:w-[35%]'>Esse é o resumo de suas viagens, aqui você pode conferir o quanto arrecadou e quantos passageiros recebeu!</p>
          </div>
          <div className='pt-24 mt-10'>

          </div>
    </>
  )
}

export default ResumeApp