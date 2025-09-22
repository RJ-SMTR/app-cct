import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  TableFooter
} from "@mui/material";

import { selectUser } from 'app/store/userSlice';

import { useDispatch, useSelector } from "react-redux";

import { handleReportInfo } from "app/store/reportSlice";

import "jspdf-autotable";
import { showMessage } from "app/store/fuse/messageSlice";

export default function ReportVanzeiro() {
  const reportType = 'financial-movement'
  const reportList = useSelector((state) => state.report.reportList);
  const [isLoading, setIsLoading] = useState(false);

  const user = useSelector(selectUser);

  const dispatch = useDispatch();

  const onSubmit = (data) => {
    setIsLoading(true);

    const requestData = { ...data };

    requestData.name = [
      {
        fullName: user.fullName,
        userId: user.id
      }
    ];

    requestData.userIds = [user.id]
    requestData.especificos = ['Pendentes'];
    requestData.dateRange = [
      new Date('2025-01-01'),
      new Date(),
    ]
    requestData.valorMax = ''
    requestData.valorMin = ''

    dispatch(handleReportInfo(requestData, reportType))
      .then((response) => {
        setIsLoading(false);
      })
      .catch((error) => {
        dispatch(
          showMessage({
            message: "Erro na busca, verifique os campos e tente novamente.",
          }),
        );
        setIsLoading(false);
      });
  };

  useEffect(() => {
    setIsLoading(false);
  }, [reportList]);



  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });


  const getStatusStyles = (status) => {
    switch (status) {
      case "Pago":
        return "bg-green-300 text-black";
      case "Estorno":
        return "bg-yellow-400 text-black";
      case "Pendente":
        return "bg-gray-400 text-black";
      default:
        return "bg-red-300 text-black";
    }
  };

  useEffect(() => {
    onSubmit()
  }, [])

  return (
    <>
      <Paper>
        <Box className="w-full md:mx-9 p-24 relative mt-32">
          <div
            style={{ height: "70vh", width: "100%" }}
            className="overflow-scroll"
          >
            <Table size="small">
              <TableHead>
                <TableRow className="sticky top-0 bg-white z-10">
                  <TableCell className="font-semibold py-1 text-sm leading-none">Data Pagamento</TableCell>
                  <TableCell className="font-semibold p-1 text-sm " style={{ whiteSpace: 'nowrap' }}>
                    Nome
                  </TableCell>
                  <TableCell className="font-semibold p-1 text-sm " style={{ maxWidth: 220 }}>Email</TableCell>
                  <TableCell className="font-semibold py-1 text-sm leading-none">Cód. Banco</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Banco</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">CPF/CNPJ</TableCell>
                  <TableCell className="font-semibold py-1 text-sm leading-none">Consórcios | Modais</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Valor</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody className="overflow-scroll">
                {!isLoading ? (
                  reportList.count > 0 ? (
                    reportList.data?.map((report, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-base py-1">{report.dataPagamento}</TableCell>
                        <TableCell className="text-base py-6 px-1 text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                          {report.nomes}
                        </TableCell>
                        <TableCell className="text-base py-6 px-1" style={{ maxWidth: 220, overflowWrap: 'break-word' }}>{report.email}</TableCell>
                        <TableCell className="text-base py-1 ">{report.codBanco}</TableCell>
                        <TableCell
                          className="text-base py-6 px-1"
                          style={{
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: 120,
                          }}
                        >
                          {report.nomeBanco}
                        </TableCell>
                        <TableCell className="text-base py-6 px-1 " >
                          {report.cpfCnpj.replace(
                            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                            "$1.$2.$3/$4-$5"
                          )}
                        </TableCell>
                        <TableCell className="text-base py-1 ">{report.consorcio}</TableCell>
                        <TableCell className="text-base py-6 px-1 ">{formatter.format(report.valor)}</TableCell>
                        <TableCell className="text-base py-6 px-1 ">
                          <span
                            className={`px-3 py-1 rounded-full text-base py-1 px-1 ${getStatusStyles(report.status)}`}
                          >
                            {report.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Não há dados para serem exibidos
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box className="flex justify-center items-center m-10">
                        <CircularProgress />
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter className="sticky bottom-0 bg-white z-10">


                <TableRow></TableRow>
                {(reportList.valorPago > 0 || reportList.valorEstornado > 0 || reportList.valorRejeitado > 0 || reportList.valor > 0 || reportList.valorPendente > 0) && (
                  <TableRow>
                    <TableCell />
                    <TableCell colSpan={7} className="text-right font-bold text-black text-base pt-16">
                      {[
                        reportList.valorPago > 0 && `Total Pago: ${formatter.format(reportList.valorPago)}`,
                        reportList.valorEstornado > 0 && `Total Estorno: ${formatter.format(reportList.valorEstornado)}`,
                        reportList.valorRejeitado > 0 && `Total Rejeitado: ${formatter.format(reportList.valorRejeitado)}`,
                        reportList.valorPendente > 0 && `Total Pendentes: ${formatter.format(reportList.valorPendente)}`,
                        reportList.valor > 0 && `Total Geral: ${formatter.format(reportList.valor)}`
                      ]
                        .filter(Boolean)
                        .join("    |    ")
                      }
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableFooter>
            </Table>
          </div>
        </Box>
      </Paper>
    </>
  );
}
