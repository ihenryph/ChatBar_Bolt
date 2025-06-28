import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface ChatMessageProps {
  text: string;
  isOwnMessage?: boolean;
  timestamp?: string;
  seen?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  text,
  isOwnMessage = false,
  timestamp,
  seen = false,
}) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 px-2`}>
      <div
        className={`relative px-3 py-2 rounded-lg max-w-xs text-sm leading-snug break-words ${
          isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
        }`}
      >
        {/* Mensagem com quebra de linha visível */}
        <p className="text-sm leading-snug">
          {text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </p>

        {/* Timestamp e status de visualização */}
        {timestamp && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${
            isOwnMessage ? 'text-white/70' : 'text-gray-600'
          }`}>
            <span>{timestamp}</span>
            {isOwnMessage && (
              seen ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;




// import React from 'react';
// import { Check, CheckCheck } from 'lucide-react';

// interface ChatMessageProps {
//   text: string;
//   isOwnMessage?: boolean;
//   timestamp?: string;
//   seen?: boolean;
// }

// const ChatMessage: React.FC<ChatMessageProps> = ({
//   text,
//   isOwnMessage = false,
//   timestamp,
//   seen = false,
// }) => {
//   return (
//     <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 px-2`}>
//       <div
//         className={`relative px-3 py-2 rounded-lg max-w-xs whitespace-pre-line text-sm leading-snug break-words ${
//           isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
//         }`}
//       >
//         {/* Aqui a quebra de linha é preservada */}
//         <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</p>


//         {/* Timestamp e status */}
//         {timestamp && (
//           <div className={`flex items-center gap-1 mt-1 text-xs ${
//             isOwnMessage ? 'text-white/70' : 'text-gray-600'
//           }`}>
//             <span>{timestamp}</span>
//             {isOwnMessage && (
//               seen ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatMessage;
