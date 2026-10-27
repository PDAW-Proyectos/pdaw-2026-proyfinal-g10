// loanRoutes.js: todas las rutas requieren sesión
router.use(requireAuth);
router.get('/', controller.listMine);
router.get('/overdue', requireLibrarian, controller.listOverdue);
router.post('/', controller.create);
router.post('/:id/return', controller.giveBack);
// bookRoutes.js: lectura pública, escritura restringida
router.get('/', controller.list);
router.post('/', requireLibrarian, controller.create);
router.delete('/:id', requireLibrarian, controller.remove);
// loanController.js: el usuario sale de la sesión, nunca del cuerpo
await loanService.lend({ userId: req.user.id, bookId: req.body?.bookId });