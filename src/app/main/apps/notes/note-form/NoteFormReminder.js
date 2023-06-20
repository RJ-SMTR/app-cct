import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useMemo } from 'react';

function NoteFormReminder(props) {
  return useMemo(
    () => (
      <DateTimePicker
        disablePast
        value={props.reminder ? new Date(props.reminder) : null}
        onChange={(val) => props.onChange(val.toString())}
        showToolbar
        defaultValue={new Date(Date.now())}
        sx={{
          '& .MuiInputAdornment-root': {
            minWidth: 40,
            minHeight: 40,
            m: 0,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            display: 'none',
          },
          '& .MuiOutlinedInput-root': {
            padding: 0,
          },
          '& .MuiInputBase-input': {
            position: 'absolute',
            pointerEvents: 'none',
            visibility: 'hidden',
          },
        }}
        slotProps={{
          actionBar: {
            actions: ['clear', 'today'],
          },
        }}
        slots={{
          openPickerIcon: () => <FuseSvgIcon size={20}>heroicons-outline:bell</FuseSvgIcon>,
        }}
      />
    ),
    [props.reminder]
  );
}

export default NoteFormReminder;
