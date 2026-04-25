import { z } from 'zod'

/** Login passageiro */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Indica o e-mail.')
    .pipe(z.email({ error: 'E-mail inválido.' })),
  password: z.string().min(1, 'Indica a senha.').min(4, 'A senha deve ter pelo menos 4 caracteres.'),
})

export type LoginFormInput = z.input<typeof loginFormSchema>
export type LoginFormValues = z.output<typeof loginFormSchema>

/** Cartão (dígitos apenas, já normalizados no componente) */
export const addCardFormSchema = z
  .object({
    cardNumberDigits: z
      .string()
      .regex(/^\d+$/, 'Use apenas números no cartão.')
      .refine((d) => d.length >= 13 && d.length <= 19, 'Número do cartão deve ter entre 13 e 19 dígitos.'),
    expiryDigits: z
      .string()
      .length(4, 'Indica a validade MM/AA completa.')
      .regex(/^\d{4}$/, 'Validade só com números.'),
    cvvDigits: z
      .string()
      .regex(/^\d+$/, 'CVV só com números.')
      .refine((d) => d.length === 3 || d.length === 4, 'CVV deve ter 3 ou 4 dígitos.'),
  })
  .superRefine((data, ctx) => {
    const mm = Number(data.expiryDigits.slice(0, 2))
    const yy = Number(data.expiryDigits.slice(2, 4))
    if (!Number.isInteger(mm) || mm < 1 || mm > 12) {
      ctx.addIssue({ code: 'custom', path: ['expiryDigits'], message: 'Mês inválido (01–12).' })
      return
    }
    const now = new Date()
    const cent = now.getFullYear() - 2000
    const curM = now.getMonth() + 1
    if (yy < cent || (yy === cent && mm < curM)) {
      ctx.addIssue({ code: 'custom', path: ['expiryDigits'], message: 'Cartão expirado.' })
    }
  })

export type AddCardFormValues = z.infer<typeof addCardFormSchema>

/** Destinatário (entrega) */
export const entregaRecipientFormSchema = z.object({
  addressLine: z.string().trim().min(3, 'Endereço demasiado curto.').max(200, 'Endereço demasiado longo.'),
  addressDetails: z.string().max(120, 'Detalhes demasiado longos.').optional(),
  contactName: z.string().trim().min(2, 'Indica o nome do destinatário.').max(80, 'Nome demasiado longo.'),
  phoneDigits: z
    .string()
    .regex(/^\d+$/, 'Telefone só com números.')
    .refine((d) => d.length >= 10 && d.length <= 11, 'Telefone (com DDD): 10 ou 11 dígitos.'),
})

export type EntregaRecipientFormValues = z.infer<typeof entregaRecipientFormSchema>

export const entregaColetaPointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  primary: z.string().min(1, 'Endereço de coleta em falta.'),
  secondary: z.string(),
})

/** Enviar: destino no mapa + contacto (sem endereço em texto livre). */
export const entregaDestinatarioMapFormSchema = z.object({
  addressDetails: z.string().max(120, 'Detalhes demasiado longos.').optional(),
  contactName: z.string().trim().min(2, 'Indica o nome do destinatário.').max(80, 'Nome demasiado longo.'),
  phoneDigits: z
    .string()
    .regex(/^\d+$/, 'Telefone só com números.')
    .refine((d) => d.length >= 10 && d.length <= 11, 'Telefone (com DDD): 10 ou 11 dígitos.'),
  destino: entregaColetaPointSchema,
})

export type EntregaDestinatarioMapFormValues = z.infer<typeof entregaDestinatarioMapFormSchema>

/** Receber: remetente + ponto de coleta no mapa (sem campo de texto “endereço” — vem do mapa). */
export const entregaRemetenteFormSchema = z.object({
  addressDetails: z.string().max(120, 'Detalhes demasiado longos.').optional(),
  contactName: z.string().trim().min(2, 'Indica o nome do remetente.').max(80, 'Nome demasiado longo.'),
  phoneDigits: z
    .string()
    .regex(/^\d+$/, 'Telefone só com números.')
    .refine((d) => d.length >= 10 && d.length <= 11, 'Telefone (com DDD): 10 ou 11 dígitos.'),
  coleta: entregaColetaPointSchema,
})

export type EntregaRemetenteFormValues = z.infer<typeof entregaRemetenteFormSchema>

/** Valor em texto tipo "12,34" ou "0,00" (centavos portugueses do input) */
export function parseBrlInputToNumber(value: string): number {
  const t = value.trim()
  if (!t || t === '0' || t === '0,0' || t === '0,00') return 0
  const normalized = t.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : Number.NaN
}

export const entregaItemFormSchema = z
  .object({
    typeId: z.string().min(1, 'Escolhe um tipo de item.').max(32),
    valueBrl: z.string(),
    notes: z.string().max(500, 'Observações: máximo 500 caracteres.'),
  })
  .superRefine((data, ctx) => {
    const n = parseBrlInputToNumber(data.valueBrl)
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: 'custom', path: ['valueBrl'], message: 'Valor inválido.' })
    } else if (n > 500) {
      ctx.addIssue({
        code: 'custom',
        path: ['valueBrl'],
        message: 'Nesta versão o valor do item não pode ultrapassar R$500.',
      })
    }
  })

export type EntregaItemFormValues = z.infer<typeof entregaItemFormSchema>

/** Nome de favorito ao guardar */
export const favoritePlaceNameSchema = z
  .string()
  .trim()
  .min(1, 'Indica um nome para o favorito.')
  .max(40, 'Nome do local: máximo 40 caracteres.')

/** Preço “Negocia” ao solicitar corrida */
export const rideNegociaPriceSchema = z
  .number({ error: 'Preço inválido.' })
  .min(5, 'Valor mínimo: R$5.')
  .max(99_999, 'Valor demasiado alto.')

/** ID de pedido na rota /status/:requestId */
export const tripRequestIdParamSchema = z.coerce.number().int().positive('ID de pedido inválido.')
