const asyncHandeler = (reqHandeler) => (req, res, next) => {
  Promise.resolve(reqHandeler(req, res, next)).catch((error) => {
    next(error);
  });
};

export { asyncHandeler };

// const asyncHandeler2 = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, err);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
