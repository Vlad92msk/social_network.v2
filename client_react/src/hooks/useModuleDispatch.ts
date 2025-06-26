// import { useEffect } from 'react';
//
// export const useModuleDispatch = (actions: { enter?: Action; exit?: Action }) => {
//   const dispatch = useDispatch();
//
//   useEffect(() => {
//     dispatch(actions.enter);
//     return () => {
//       if (actions.exit) {
//         dispatch(actions.exit);
//       }
//     };
//   }, [dispatch]);
// };
