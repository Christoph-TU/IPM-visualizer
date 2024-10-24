import { makeStyles } from '@material-ui/core/styles';

const useGlobalStyle = makeStyles((theme) => ({
  iconButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark, // Change this to your desired hover color
    },
  },
}));

export default useGlobalStyle;