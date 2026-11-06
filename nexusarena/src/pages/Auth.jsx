import { Link, useNavigate } from 'react-router-dom';
import { Form, Field, SelectField } from '../components/forms.jsx';
import { AuthService, ROLES } from '../lib/services.js';
import { toast } from '../lib/ui.js';

export function Login() {
  const navigate = useNavigate();
  return (
    <section className="panel narrow">
      <h1>Ingresar</h1>
      <Form onSubmit={async (d) => { await AuthService.login(d); toast('Bienvenido'); navigate('/torneos'); }}>
        <Field name="email" label="Correo" type="email" autoComplete="email" />
        <Field name="password" label="Contraseña" type="password" autoComplete="current-password" />
        <button className="btn">Ingresar</button>
      </Form>
      <p className="hint">Demo organizador: organizador@demo.com / Demo1234</p>
      <p>¿Sin cuenta? <Link to="/registro">Regístrate</Link></p>
    </section>
  );
}

export function Register() {
  const navigate = useNavigate();
  return (
    <section className="panel narrow">
      <h1>Crear cuenta</h1>
      <Form onSubmit={async (d) => { await AuthService.register(d); toast('Cuenta creada'); navigate('/perfil'); }}>
        <Field name="name" label="Nombre completo" autoComplete="name" />
        <Field name="nick" label="Nick de jugador" />
        <Field name="email" label="Correo" type="email" autoComplete="email" />
        <Field name="university" label="Universidad o comunidad" />
        <Field name="password" label="Contraseña" type="password" autoComplete="new-password" />
        <SelectField name="role" label="Participaré como" options={ROLES} />
        <button className="btn">Registrarme</button>
      </Form>
    </section>
  );
}
