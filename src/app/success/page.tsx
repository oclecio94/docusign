import { useRouter } from "next/navigation";
import React from "react";

const page = () => {
  const router = useRouter();
  return (
    <div>
      {" "}
      <div>
        <h1>Sucesso!</h1>
        <p>
          O documento foi enviado com sucesso. Verifique seu email para mais
          detalhes.
        </p>

        <button
          onClick={() => router.push("/")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default page;
