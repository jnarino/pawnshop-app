"use strict";
// Inventory Item Domain Model
// Supports three primary types: FIREARM, JEWELRY, GENERIC (which will later branch into many sub-categories)
// A single inventory item MAY or MAY NOT be associated with a pawn ticket. That relationship will
// be modeled later (likely via a linking table pawn_ticket_inventory or a nullable FK on a join table)
// to allow future scenarios like partial item grouping, multiple tickets history, etc.
Object.defineProperty(exports, "__esModule", { value: true });
