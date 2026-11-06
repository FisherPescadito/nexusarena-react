import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { BusinessError } from '../lib/validators.js';

const FormCtx = createContext({ errors: {} });

export function Field({ name, label, type = 'text', ...rest }) {
  const { errors } = useContext(FormCtx);
  return (
    <label>{label}
      <input name={name} type={type} aria-invalid={Boolean(errors[name])} {...rest} />
      <small className="error">{errors[name]}</small>
    </label>
  );
}

export function SelectField({ name, label, options, ...rest }) {
  const { errors } = useContext(FormCtx);
  return (
    <label>{label}
      <select name={name} aria-invalid={Boolean(errors[name])} {...rest}>
        {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <small className="error">{errors[name]}</small>
    </label>
  );
}

/** Formulario no controlado: recoge los datos, captura BusinessError y los muestra por campo. */
export function Form({ onSubmit, children }) {
  const [errors, setErrors] = useState({});
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setErrors({});
    try { await onSubmit(data); }
    catch (err) {
      if (err instanceof BusinessError) setErrors({ _form: err.message, ...err.errors });
      else { console.error(err); setErrors({ _form: 'Error al guardar el registro. Inténtalo de nuevo.' }); }
    }
  };
  return (
    <FormCtx.Provider value={{ errors }}>
      <form noValidate onSubmit={handleSubmit}>
        {children}
        <p className="error" role="alert">{errors._form}</p>
      </form>
    </FormCtx.Provider>
  );
}

/** Diálogo modal con formulario para crear/editar. */
export function FormModal({ title, submitLabel = 'Guardar', onSubmit, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return (
    <dialog ref={ref} onClose={onClose}>
      <h2>{title}</h2>
      <Form onSubmit={async (data) => { await onSubmit(data); onClose(); }}>
        {children}
        <menu>
          <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn">{submitLabel}</button>
        </menu>
      </Form>
    </dialog>
  );
}
