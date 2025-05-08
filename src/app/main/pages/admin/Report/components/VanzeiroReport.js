import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    MenuItem,
    Table,
    TableHead,
    TableBody,
    Button,
    TableRow,
    TableCell,
    Paper, 
    CircularProgress,    
    Menu    
} from '@mui/material';
import { ptBR as pt } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';

import { useForm } from 'react-hook-form';

import { handleReportInfo } from 'app/store/reportSlice';
import { getUser } from 'app/store/adminSlice';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { showMessage } from 'app/store/fuse/messageSlice';

import { utils, writeFile as writeFileXLSX } from 'xlsx';

export default function BasicEditingGrid() {
    const reportType = useSelector(state => state.report.reportType);
    const reportList = useSelector(state => state.report.reportList)
    const userList = useSelector(state => state.admin.userList) || []
    const [isLoading, setIsLoading] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [userOptions, setUserOptions] = useState([])
    const [anchorEl, setAnchorEl] = useState(null);
    const [setShowButton] = useState(false)
   
    const dispatch = useDispatch()

    const { handleSubmit, setValue, control, getValues } = useForm({
        defaultValues: {         
            dateRange: []          
        }
    });

    const onSubmit = (data) => {
        if (data.name.length === 0) {
            dispatch(showMessage({ message: 'Erro na busca' }))
        } else {
            setIsLoading(true)

            dispatch(handleReportInfo(data, reportType))
                .then((response) => {
                    setIsLoading(false)
                })
                .catch((error) => {
                    dispatch(showMessage({ message: 'Erro na busca, verifique os campos e tente novamente.' }))
                    setIsLoading(false)
                });
        }
    };   

    const fetchUsers = async () => {
        setLoadingUsers(true);
        dispatch(getUser());
        setLoadingUsers(false);
    };

    useEffect(() => {
        fetchUsers()
    }, []);

    useEffect(() => {
        setIsLoading(false)
    }, [reportList]);

    // Handle AutoComplete
    useEffect(() => {
        if (userList && userList.length > 0) {
            const options = userList.map((user) => ({
                label: user.label,
                value: {
                    cpfCnpj: user.cpfCnpj,
                    permitCode: user.permitCode,
                    fullName: user.fullName,
                    userId: user.id
                }
            }));
            const sortedOptions = options.sort((a, b) => {
                return a.value.fullName.localeCompare(b.value.fullName);
            });

            setUserOptions([{label: "Todos", value:{fullName: 'Todos'}}, ...sortedOptions]);
        } else {
            setUserOptions([]);
        }
    }, [ userList]); 
  

    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    // Export CSV
    const status = getValues('status')

    const reportListData = reportList.count > 0
        ? reportList.data?.map(report => ({
            Nome: report.nomefavorecido,
            Valor: formatter.format(report.valor),
            Status: "",  
        }))
        : [];

    const valorTotal = {
                Nome: "Valor Total",
                Valor: "",
                Status: formatter.format(reportList?.valor),
            }    

    const csvData =[ 
            statusRow,
            ...reportListData,
            valorTotal
    ]
    let dateInicio;
    let dateFim;
    const selectedDate = getValues('dateRange');

    if (selectedDate !== null) {
        dateInicio = selectedDate[0];
        dateFim = selectedDate[1];
    }

    const csvFilename = useMemo(() => {
        if (dateInicio && dateFim) {
            return `relatorio_${format(dateInicio, 'dd-MM-yyyy')}_${format(dateFim, 'dd-MM-yyyy')}.csv`;
        }
        return `relatorio_${format(new Date(), 'dd-MM-yyyy')}.csv`; 
    }, [dateInicio, dateFim])

    // Export PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["Data de Vencimento", "Valor","Status","Motivo Erro"];
        const tableRows = [];

        reportList.data.forEach(report => {
            const reportData = [
                report.dataVencimento,
                formatter.format(report.valor),
                report.status,
                report.motivo
            ];
            tableRows.push(reportData);
        });
        let dateInicio;
        let dateFim;
        const selectedDate = getValues('dateRange');

        if (selectedDate !== null) {
            dateInicio = selectedDate[0];
            dateFim = selectedDate[1];
        }
  

        const logoImg = 'assets/icons/logoPrefeitura.png';
        const logoH = 15;
        const logoW = 30; 
       
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            margin: {left: 14 , right: 14, top: 60},
            startY: 60,
            didDrawPage: (data) => {               
                doc.addImage(logoImg, 'PNG', 14, 10, logoW, logoH);               
                const hrYPosition = 30;
                doc.setLineWidth(0.3);
                doc.line(14, hrYPosition, 196, hrYPosition);               
                doc.setFontSize(10);
                doc.text(`Relatório dos dias: ${format(dateInicio, 'dd/MM/yyyy')} a ${format(dateFim, 'dd/MM/yyyy')}`, 14, 45);               
                
            },
        });

        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i); 
            doc.setFontSize(10);

            const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
            const text = `Página ${currentPage} de ${pageCount}`;
            const xPos = 14; 
            const yPos = doc.internal.pageSize.height - 5;

            doc.text(text, xPos, yPos);
        }

        const totalValue = `Valor total: ${formatter.format(reportList.valor ?? 0)}`;
        doc.setFontSize(10);
        doc.text(totalValue, 14, doc.internal.pageSize.height - 10);

       
        doc.save(`relatorio_${format(dateInicio, 'dd/MM/yyyy')}_${format(dateFim, 'dd/MM/yyyy')}.pdf`);
    };

    // Export XLSX
    const exportXLSX = () => {
        let dateInicio;
        let dateFim;
        const selectedDate = getValues('dateRange');

        if (selectedDate !== null) {
            dateInicio = selectedDate[0];
            dateFim = selectedDate[1];
        }
        const data = [     
            ["dataVencimento", "Valor","status","motivo"], 
            ...reportList.data.map(report => [
                report.nomefavorecido,
                formatter.format(report.valor),
            ]),
            ["Valor Total", "",  formatter.format(reportList.valor ?? 0)],
       
        ];

        const wb = utils.book_new();
        utils.book_append_sheet(wb, utils.json_to_sheet(data));
        writeFileXLSX(wb, `relatorio_${format(dateInicio, 'dd/MM/yyyy')}_${format(dateFim, 'dd/MM/yyyy')}.xlsx`);
    };


    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (option) => {
        setAnchorEl(null);
        if (option === 'csv') {
            document.getElementById('csv-export-link').click();
        } else if (option === 'pdf') {
            exportPDF();
        } else if (option === 'xlsx') {
            exportXLSX();
        }
    };

    return (
        <>
            <Paper>
                <Box className="w-full md:mx-9 p-24 relative mt-32">
                    <header>Filtros de Pesquisa</header>

                    <Box className="flex items-center py-10 gap-10">
                        <form onSubmit={handleSubmit(onSubmit)}>                          
                           
                            <Box className="flex items-center my-[3.5rem] gap-10 flex-wrap">                               
                                <Controller
                                    name="dateRange"
                                    control={control}
                                    render={({ field }) => (
                                        <DateRangePicker
                                            {...field}
                                            id="custom-date-input"
                                            showOneCalendar
                                            showHeader={false}
                                            placement="auto"
                                            placeholder="Selecionar Data"
                                            format="dd/MM/yy"
                                            character=" - "
                                            className="custom-date-range-picker"
                                        />
                                    )}
                                />
                            </Box>
                            <Box>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    className=" w-35% mt-16 z-10"
                                    aria-label="Pesquisar"
                                    type="submit"
                                    size="medium"
                                >
                                    Pesquisar
                                </Button>
                                <Button
                                    variant="contained"
                                    className=" w-35% mt-16 mx-10 z-10"
                                    aria-label="Limpar Filtros"
                                    type="button"
                                    size="medium"
                                    onClick={() => handleClear()}
                                >
                                    Limpar Filtros
                                </Button>
                            </Box>
                        </form>

                    </Box>
                </Box>
            </Paper>

            <Paper>
                <Box className="w-full md:mx-9 p-24 relative mt-32">
                    <header className="flex justify-between items-center">
                        <h3 className="font-semibold mb-24">
                            Data Vigente: {format(new Date(), 'dd/MM/yyyy')}
                        </h3>


                        <Button
                            aria-controls="simple-menu"
                            aria-haspopup="true"
                            onClick={handleMenuClick}
                            style={{ marginTop: '20px' }}
                        >

                        <svg className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium muiltr-hgpioi-MuiSvgIcon-root h-[2rem]" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="SaveAltIcon"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"></path></svg> Exportar

                        </Button>
                        <Menu
                            id="simple-menu"
                            anchorEl={anchorEl}
                            keepMounted
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                        >
                            <MenuItem onClick={() => handleMenuClose('csv')}>CSV</MenuItem>
                            <MenuItem onClick={() => handleMenuClose('pdf')}>PDF</MenuItem>
                            <MenuItem onClick={() => handleMenuClose('xlsx')}>XLSX</MenuItem>
                        </Menu>

                        <CSVLink
                            id="csv-export-link"
                            data={csvData}
                            filename={csvFilename}
                            className="hidden"
                        />
                    </header>

                    <div style={{ height: '50vh', width: '100%' }} className="overflow-scroll">
                        <Table size='small'>
                            <TableHead className="items-center mb-4">
                                <TableRow>
                                    <TableCell>Data de Vencimento</TableCell>
                                    <TableCell>Valor</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Motivo Erro</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!isLoading ? (
                                    reportList.count > 0 ? (
                                        reportList.data?.map((report, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{report.dataVencimento}</TableCell>                                               
                                                <TableCell>{formatter.format(report.valor)}</TableCell>
                                                <TableCell>{report.status}</TableCell>
                                                <TableCell>{report.motivo}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2}>Não há dados para serem exibidos</TableCell>
                                        </TableRow>
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Box className="flex justify-center items-center m-10">
                                                <CircularProgress />
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow key={Math.random()}>
                                    <TableCell className='font-bold'>Valor Total: </TableCell>
                                    <TableCell className='font-bold'> {formatter.format(reportList.valor ?? 0)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </Box>
            </Paper>
        </>
    );
}