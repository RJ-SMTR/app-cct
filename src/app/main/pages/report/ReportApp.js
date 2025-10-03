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
    requestData.especificos = ["Pendentes"]
    requestData.userIds = [user.id]
    requestData.dateRange = [
      new Date(2025, 0, 1),
      new Date(),
    ]
    requestData.valorMax = ''
    requestData.valorMin = ''
    requestData.status = ['Pendencia Paga', 'Erro']
    dispatch(handleReportInfo(requestData, reportType)).then((response) => {
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
      case "Pendência de Pagamento":
        return "bg-gray-400 text-black";
      case "Pendencia Paga":
        return "bg-blue-400 text-black";
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
                  <TableCell className="font-semibold py-1 text-sm leading-none">Data Tentativa Pagamento</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Data Efetiva Pagamento</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Valor</TableCell>
                  <TableCell className="font-semibold p-1 text-sm ">Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody className="overflow-scroll">
                {!isLoading ? (
                  reportList.count > 0 ? (
                    reportList.data?.map((report, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-base py-1">{report.dataReferencia}</TableCell>
                        <TableCell className="text-base py-1 ">{report.status == 'Pendencia Paga' ? report.dataPagamento : '-'}</TableCell>
                        <TableCell className="text-base py-6 px-1 ">{formatter.format(report.valor)}</TableCell>
                        <TableCell className="text-base py-6 px-1 ">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getStatusStyles(
                              report.status === "Pendente" ? "Pendência de Pagamento" : report.status
                            )}`}
                          >
                            {report.status === "Pendente" ? "Pendência de Pagamento" : report.status}
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
                        reportList.valorEstornado > 0 && `Total Estorno: ${formatter.format(reportList.valorEstornado)}`,
                        reportList.valorRejeitado > 0 && `Total Rejeitado: ${formatter.format(reportList.valorRejeitado)}`,
                        reportList.valorPendente > 0 && `Total Pendentes: ${formatter.format(reportList.valorPendente)}`,
                        reportList.valorPendenciaPaga > 0 && `Total Pendencia Paga: ${formatter.format(reportList.valorPendenciaPaga)}`,
                        (reportList.valorEstornado + reportList.valorRejeitado + reportList.valorPendente - reportList.valorPendenciaPaga) > 0 &&
                        `Saldo a Receber: ${formatter.format(
                          reportList.valorEstornado + reportList.valorRejeitado + reportList.valorPendente - reportList.valorPendenciaPaga
                        )}`
                      ]
                        .filter(Boolean)
                        .join("    |    ")
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
