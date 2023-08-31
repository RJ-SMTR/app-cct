import { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ResumeContext } from 'src/app/hooks/ResumeContext';
import { ExtractContext } from 'src/app/hooks/ExtractContext';

import { Grid, Typography } from '@mui/material';
import { Box } from '@mui/system';
import Button from '@mui/material/Button';
import { selectUser } from 'app/store/userSlice';
import Trips from './widgets/Trips';
import { TripsResume } from '../home/widgets/Widgets';
import { Hidden } from '@mui/material';
import Popover from '@mui/material/Popover';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { locale } from '../extract/utils/locale';
import DateRangePicker from 'rsuite/DateRangePicker';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';

function ResumeApp() {
  const {previousDays, dateRange, setDateRange, setPreviousDays} = useContext(ExtractContext)
  const [filterMenu, setFilterMenu] = useState(null);
    const {getResume, resume} = useContext(ResumeContext)
    const user = useSelector(selectUser);
    const fullName = user.fullName ?? 'Admin'
    const [first] = fullName?.split(' ');

    useEffect(() => {
      getResume(previousDays, dateRange)
    }, [previousDays, dateRange])
  useEffect(() => {
    if(dateRange.length != 0){
      setDateRange([])
    }
  }, [])
    

  const filterMenuClick = (event) => {
    setFilterMenu(event.currentTarget);
  }

  const filterMenuClose = () => {
    setFilterMenu(null);
  }
  const handleDays = (event) => {
    setPreviousDays(parseInt(event.currentTarget.dataset.value))
    setFilterMenu(null)
    setDateRange([])
  }
  const { afterToday } = DateRangePicker;
  return (
    <>
          <div className="p-24 text-white bg-[#004A80] overflow">
              <h2 className='fw-black'>Bem vindo, {first}</h2>
              <p className='w-[100%] md:w-[35%]'>Esse é o resumo de suas viagens, aqui você pode conferir o quanto arrecadou e quantos passageiros recebeu!</p>
          </div>
          <div className='p-24 mt-10'>
              <Typography className='font-medium text-3xl'>Resumo das Viagens</Typography>  
        <Trips count={resume.length} resume={resume}/>
            <Box className='flex flex-col justify-between mt-24'>
            <Box className='flex justify-between align-center'>
            <Typography className='font-medium text-2xl'>Viagens anteriores</Typography>
           
              <div className="flex align-center">
              <Hidden smDown >
                <DateRangePicker
                  showOneCalendar
                  placeholder="Selecionar Data"
                  placement='leftStart'
                  disabledDate={afterToday()}
                  format='dd/MM/yy'
                  locale={locale}
                  character=' - '
                  onChange={(newValue) => setDateRange(newValue)}

                />
              </Hidden>
                <Button onClick={filterMenuClick}>
                  <FuseSvgIcon className="text-48" size={24} color="action">feather:filter</FuseSvgIcon>
                </Button>

                <Box className='py-6' >
                <Hidden smUp >
                  <label htmlFor="resume" >
                    <FuseSvgIcon className="text-48" size={24} color="action">material-outline:edit_calendar</FuseSvgIcon>
                  </label>
                  <DateRangePicker
                    id="resume"
                    showOneCalendar
                    className='mobile'
                    placeholder="Selecionar Data"
                    appearance='subtle'
                    disabledDate={afterToday()}
                    format='dd/MM/yy'
                    locale={locale}
                    character=' - '
                    onChange={(newValue) => setDateRange(newValue)}

                  />
                </Hidden>
            

                </Box>
              </div>
            <Popover
              open={Boolean(filterMenu)}
              anchorEl={filterMenu}
              onClose={filterMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              classes={{
                paper: 'py-8',
              }}
            >
              <MenuItem role="button" onClick={handleDays} data-value={7}>
                <ListItemText primary="7 dias" />
              </MenuItem>
              <MenuItem role="button" onClick={handleDays} data-value={14}>
                <ListItemText primary="14 dias" />
              </MenuItem>
              <MenuItem role="button" onClick={handleDays} data-value=''>
                <ListItemText primary="Mês todo" />
              </MenuItem>
              </Popover>
                </Box>
          <Grid container spacing={3}>
                {resume.map((i) => {
                  const date = new Date(`${i.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'Etc/UTC', year: 'numeric', month: '2-digit', day: '2-digit' })
                  return (
                    <Grid xs={12} md={4} lg={3}  item>
                      <TripsResume id={i.id} date={date} amount={i.netAmount} />
                    </Grid>
                  )
                })}
            </Grid>

                
                
            </Box> 
          </div>
    </>
  )
}

export default ResumeApp