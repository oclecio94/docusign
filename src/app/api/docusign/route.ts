import path from "path";
import fs from "fs";
import { promisify } from "util";
import { ApiClient, EnvelopesApi } from "docusign-esign";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const readFileAsync = promisify(fs.readFile);

async function checkToken(req: any, res: any) {
  const { access_token, expires_at } = req.cookies;

  if (access_token && Date.now() < expires_at) {
    return access_token;
  } else {
    let dsApiClient = new ApiClient();
    dsApiClient.setBasePath(process.env.BASE_PATH!);

    const privateKeyPath = path.join(process.cwd(), "private.key");
    const privateKeyBuffer = await readFileAsync(privateKeyPath);
    const privateKey = privateKeyBuffer.toString("utf8");

    const results = await dsApiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY!,
      process.env.DOCUSIGN_USER_ID!,
      ["signature"],
      privateKey as any,
      3600
    );

    const newAccessToken = results.body.access_token;
    const expiresAt = Date.now() + (results.body.expires_in - 60) * 1000;

    cookies().set("access_token", newAccessToken);
    cookies().set("expires_at", expiresAt.toString());

    return newAccessToken;
  }
}

function getEnvelopesApi(token: any) {
  let dsApiClient = new ApiClient();
  dsApiClient.setBasePath(process.env.BASE_PATH!);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + token);
  return new EnvelopesApi(dsApiClient);
}

async function makeEnvelope(
  name: string,
  email: string,
  company: string,
  envelopesApi: any
) {
  const envelopeDefinition = {
    status: "sent",
    templateId: process.env.TEMPLATE_ID!,
    templateRoles: [
      {
        email: email,
        name: name,
        roleName: "Applicant",
        clientUserId: process.env.CLIENT_USER_ID!,
        tabs: {
          textTabs: [
            {
              tabLabel: "company_name",
              value: company,
            },
          ],
        },
      },
    ],
  };

  const envelopeResults = await envelopesApi.createEnvelope(
    process.env.ACCOUNT_ID!,
    { envelopeDefinition }
  );

  return envelopeResults;
}

function makeRecipientViewRequest(name: string, email: string) {
  return {
    returnUrl: "http://localhost:3000/success",
    authenticationMethod: "none",
    email: email,
    userName: name,
    clientUserId: process.env.CLIENT_USER_ID!,
  };
}

export async function POST(req: any, res: any) {
  try {
    const token = await checkToken(req, res);

    const { name, email, company } = await req.json();

    let envelopesApi = getEnvelopesApi(token);

    let envelope = await makeEnvelope(name, email, company, envelopesApi);

    let viewRequest = makeRecipientViewRequest(name, email);

    // Criar a visualização do destinatário
    let viewResults = await envelopesApi.createRecipientView(
      process.env.ACCOUNT_ID!,
      envelope.envelopeId,
      { recipientViewRequest: viewRequest }
    );

    return NextResponse.json({
      message: "Envelope criado com sucesso!",
      url: viewResults.url,
      envelopeId: envelope.envelopeId,
    });
  } catch (error) {
    return res.status(500).json({ error });
  }
}
