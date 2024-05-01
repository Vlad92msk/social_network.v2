// import { useCallback, useEffect, useRef, useState } from 'react'
//
// type Message = {
//   type: string
//   ss?: any
// };
//
// export const useWebWorker = (): {
//   postMessage: (message: Message) => void;
//   result: any;
// } => {
//   const workerRef = useRef<Worker | null>(null) // Добавляем явный тип и начальное значение null
//   const [result, setResult] = useState<any>(null)
//
//   useEffect(() => {
//     workerRef.current = new Worker(new URL('app/_workers/worker.ts', import.meta.url))
//
//     return () => {
//       workerRef.current?.terminate()
//     }
//   }, [])
//
//   const postMessage = useCallback((message: Message) => {
//     if (workerRef.current) {
//       // Устанавливаем обработчик сообщения, который будет вызван при получении ответа от Web Worker
//       workerRef.current.onmessage = (event) => {
//         setResult(event.data)
//       }
//       // Отправляем сообщение Web Worker для выполнения задачи
//       workerRef.current.postMessage(message)
//     }
//   }, [])
//
//   return { postMessage, result }
// }
