import React, { useState } from 'react'
import { handleReportVanzeiro, setVanzeiroData } from 'app/store/reportVanzeiroSlice'
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from 'app/store/userSlice';

function ReportVanzeiro() {


  const dispatch = useDispatch()
  const user = useSelector(selectUser);
  const vanzeiroData = state => state.reportVanzeiro.vanzeiroData
  const [date, setDate] = useState([])



  const handleSearch = async (data) => {
    // const id = user.id
    // dispatch(handleReportVanzeiro(data, id))
    // chamada data
  }


  return (
    <div>
      
    </div>
  )
}

export default ReportVanzeiro