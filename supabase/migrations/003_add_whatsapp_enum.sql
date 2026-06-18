-- Migration V3: Ajout de MESSAGE_VOCAL_WHATSAPP aux enums CRM
-- Pour l'option "Message Vocal WhatsApp Envoyé"

ALTER TYPE resultat_appel ADD VALUE IF NOT EXISTS 'MESSAGE_VOCAL_WHATSAPP';
ALTER TYPE statut_prospect ADD VALUE IF NOT EXISTS 'MESSAGE_VOCAL_WHATSAPP';
