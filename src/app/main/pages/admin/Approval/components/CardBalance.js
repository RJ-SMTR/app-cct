import { Paper, Skeleton, Typography } from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { format } from "date-fns";

function CardBalance({ type, amount }) {
    const date = new Date()
    const formattedDate = format(date, 'dd/MM/yyyy')
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    return (
        <>
            <Paper className="relative flex flex-col flex-auto p-12 pr-12  rounded-2xl max-w-[280px] shadow overflow-hidden mx-5 mt-10 md:mt-0">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                            {type}
                        </Typography>
                        <Typography className="font-medium text-sm"> {formattedDate}</Typography>
                    </div>
                </div>
                <div className="flex flex-row flex-wrap mt-8 ">
                        <Typography className="mt-8 font-medium text-3xl leading-none">
                            {formatter.format(amount)}
                        </Typography>

                </div>
                <div className="absolute bottom-0 ltr:right-0 rtl:left-0 w-96 h-96 -m-24">
                    <FuseSvgIcon size={90} className="opacity-25 text-green-500 dark:text-green-400">
                        heroicons-outline:currency-dollar
                    </FuseSvgIcon>
                </div>
            </Paper>
        </>
    );
}

export default CardBalance;
