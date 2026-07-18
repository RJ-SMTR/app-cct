import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import * as yup from "yup";
import _ from "@lodash";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useState } from "react";
import jwtService from "src/app/auth/services/jwtService";

const schema = yup.object().shape({
  cpf: yup.string().required("Insira seu CPF"),
  password: yup
    .string()
    .required("Por favor insira sua senha.")
    .min(4, "Senha muito curta"),
});

const defaultValues = {
  cpf: "",
  password: "",
  remember: true,
};

function normalizeCpfInput(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11);
}

function formatCpfInput(value) {
  const normalizedCpf = normalizeCpfInput(value);

  if (normalizedCpf.length !== 11) {
    return normalizedCpf;
  }

  return normalizedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function handleCpfKeyDown(event) {
  const allowedControlKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "ArrowLeft",
    "ArrowRight",
    "Home",
    "End",
  ];

  if (
    allowedControlKeys.includes(event.key) ||
    event.ctrlKey ||
    event.metaKey
  ) {
    return;
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

function AgentesSignInPage() {
  const isHmg = window.location.href.includes("hmg");
  const [showPassword, setShowPassword] = useState(false);
  const { control, formState, handleSubmit, setError } = useForm({
    mode: "onChange",
    defaultValues,
    resolver: yupResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  function onSubmit({ cpf, password }) {
    jwtService
      .signInWithCpfAndPassword(cpf.replace(/\D/g, "").trim(), password)
      .catch(() => {
        setError("password", {
          message: "CPF ou senha incorretos",
        });
      });
  }

  function handleTogglePasswordVisibility() {
    const input = document.getElementById("agentes-password");

    if (input) {
      input.blur();
    }

    setShowPassword((currentValue) => !currentValue);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center md:items-start sm:justify-center md:justify-start flex-1 min-w-0">
      <Paper className="h-full sm:h-auto flex items-center md:flex md:items-center md:justify-end w-full sm:w-auto md:h-full md:w-1/2 py-8 px-16 sm:p-48 md:p-64 sm:rounded-2xl md:rounded-none sm:shadow md:shadow-none ltr:border-r-1 rtl:border-l-1 relative">
        <div className="w-full max-w-320 h-5/6 md:h-1/2 sm:w-320 mx-auto sm:mx-0">
          <Typography className="mt-48 text-4xl font-extrabold tracking-tight leading-tight">
            <img
              src="assets/icons/logoPrefeitura.png"
              width="155"
              className="mb-10"
              alt="logo CCT"
            />
            Login de Agente
          </Typography>

          {isHmg && (
            <Box className="mt-10 bg-red-500 uppercase text-white text-center p-10 rounded-4 text-xl">
              Homologação
            </Box>
          )}

          <form
            name="agentesLoginForm"
            noValidate
            className="flex flex-col justify-center w-full mt-32"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="cpf"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  className="mb-24"
                  label="CPF"
                  autoFocus
                  type="text"
                  error={!!errors.cpf}
                  helperText={errors?.cpf?.message}
                  variant="outlined"
                  required
                  fullWidth
                  value={formatCpfInput(field.value)}
                  inputProps={{ maxLength: 14, inputMode: "numeric" }}
                  onKeyDown={handleCpfKeyDown}
                  onChange={(event) => {
                    field.onChange(normalizeCpfInput(event.target.value));
                  }}
                />
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="agentes-password"
                  className="mb-24"
                  label="Senha"
                  type={showPassword ? "text" : "password"}
                  error={!!errors.password}
                  helperText={errors?.password?.message}
                  variant="outlined"
                  required
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          onMouseDown={(event) => event.preventDefault()}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between">
              <Controller
                name="remember"
                control={control}
                render={({ field }) => (
                  <FormControl>
                    <FormControlLabel
                      label="Manter conectado"
                      control={<Checkbox size="small" {...field} />}
                    />
                  </FormControl>
                )}
              />

              <Link className="text-md font-medium" to="/forgot-password">
                Esqueceu sua senha?
              </Link>
            </div>

            <Button
              variant="contained"
              color="secondary"
              className="w-full mt-16 z-10"
              aria-label="Sign in agente"
              disabled={_.isEmpty(dirtyFields) || !isValid}
              type="submit"
              size="large"
            >
              Fazer login
            </Button>
          </form>
        </div>
        <svg
          className="absolute inset-0 pointer-events-none md:hidden"
          viewBox="0 0 960 540"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Box
            component="g"
            sx={{ color: "primary.light" }}
            className="opacity-20"
            fill="none"
            stroke="currentColor"
            strokeWidth="100"
          >
            <circle r="234" cx="720" cy="491" />
          </Box>
        </svg>
      </Paper>

      <Box className="relative hidden md:flex flex-auto items-center justify-center h-screen overflow-hidden max-w-[55vw]">
        <img
          src="assets/images/etc/kombi.jpg"
          className="h-full w-full object-fill"
          alt="Kombis CCT"
        />
      </Box>
    </div>
  );
}

export default AgentesSignInPage;
