// Una cola por base de datos: las operaciones que leen y después escriben (intentos de
// recuperación, registro de cuentas) se ejecutan en serie, también entre instancias de
// distintos servicios, para que cada una vea lo que dejó la anterior.
const queues = new WeakMap<object, Promise<unknown>>();

export function serializedByDatabase<T>(
  database: object,
  work: () => Promise<T>,
): Promise<T> {
  const previous = queues.get(database) ?? Promise.resolve();
  const run = previous.then(work, work);
  queues.set(
    database,
    run.catch(() => undefined),
  );
  return run;
}
