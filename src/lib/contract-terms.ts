// Contract terms shown on the online signing page. Mirrors the Word agreement
// (TG_Car_Vibes_Rental_Agreement_FIXED_TERM.docx). Change CONTRACT_VERSION whenever the wording changes.

export const CONTRACT_VERSION = '2026-09-fixed-term-v3';

import type { ContractRenter } from './types';

export const RENTER_FIELDS: [keyof ContractRenter, string, boolean][] = [
  ['fullName', 'Full name', true],
  ['dateOfBirth', 'Date of birth', true],
  ['licence', 'Driver licence no. / state / expiry', true],
  ['passport', 'Passport no. (overseas licence)', false],
  ['address', 'Home address', true],
  ['mobile', 'Mobile', true],
  ['email', 'Email', true],
  ['emergencyContact', 'Emergency contact (name, phone)', true],
  ['otherDrivers', 'Other Authorised Drivers', false],
];

export type Run = { text: string; bold: boolean };
export type Block = { type: 'clause' | 'sub'; num: string; runs: Run[] } | { type: 'insuranceAck' };
export type Section = { title: string; blocks: Block[] };

export const INSURANCE_ACK = "I, the Renter, have read clause 7 and fully agree to it. I understand that NO INSURANCE IS PROVIDED and that I am fully responsible for any loss of or damage to the Vehicle and any damage to other people’s property during the Rental Period.";
export const FINAL_DECLARATION = "I, the Renter, confirm that I have read this entire Agreement, fully understand it, and completely agree to all of the terms and conditions above. The information I have given in the Agreement Details is true and correct.";

export const CONTRACT_SECTIONS: Section[] = [
 {
  "title": "1. Definitions",
  "blocks": [
   {
    "type": "clause",
    "num": "1.1",
    "runs": [
     {
      "text": "\"Vehicle\"",
      "bold": true
     },
     {
      "text": " means the vehicle described in the Agreement Details, including its keys, tyres, tools, accessories and equipment.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "1.2",
    "runs": [
     {
      "text": "\"Rental Period\"",
      "bold": true
     },
     {
      "text": " means the period from the start date and time to the ending date and return time shown in the Agreement Details.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "1.3",
    "runs": [
     {
      "text": "\"Authorised Driver\"",
      "bold": true
     },
     {
      "text": " means you and any other driver we have approved in writing and who is named in the Agreement Details.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "1.4",
    "runs": [
     {
      "text": "\"Bond\"",
      "bold": true
     },
     {
      "text": " means the security deposit shown in the Agreement Details (equal to two weeks’ rent).",
      "bold": false
     }
    ]
   }
  ]
 },
 {
  "title": "2. Rental term",
  "blocks": [
   {
    "type": "clause",
    "num": "2.1",
    "runs": [
     {
      "text": "This is a fixed-term rental. The Rental Period starts on the start date and ends on the ending date shown in the Agreement Details (minimum 8 weeks).",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "2.2",
    "runs": [
     {
      "text": "You must return the Vehicle on the ending date. Any extension of the Rental Period must be agreed in writing by TG CAR VIBES PTY LTD.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "2.3",
    "runs": [
     {
      "text": "IF YOU RETURN THE VEHICLE OR TERMINATE THIS AGREEMENT BEFORE THE ENDING DATE, YOUR BOND WILL NOT BE REFUNDED.",
      "bold": true
     }
    ]
   },
   {
    "type": "clause",
    "num": "2.4",
    "runs": [
     {
      "text": "Late return: ",
      "bold": true
     },
     {
      "text": "If you do not return the Vehicle by the ending date and return time, you must pay a late fee of $30 for each day (or part of a day) until the Vehicle is returned, in addition to rent. We may also report the Vehicle as stolen under clause 10.5.",
      "bold": false
     }
    ]
   }
  ]
 },
 {
  "title": "3. Rent, bond and payments",
  "blocks": [
   {
    "type": "clause",
    "num": "3.1",
    "runs": [
     {
      "text": "Rent is payable weekly in advance by bank transfer to TG Car Vibes Pty Ltd, Commonwealth Bank, BSB 062-334, Account 12102641 (as shown in the Agreement Details), using the Vehicle’s registration number as the payment reference.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "3.2",
    "runs": [
     {
      "text": "The Bond is payable before pick-up. It is held as security for amounts you owe us under this Agreement.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "3.3",
    "runs": [
     {
      "text": "Subject to clause 2.3, we will refund the Bond within 7 days after the Vehicle is returned on the ending date, less any amounts you owe us. We will give you an itemised list of any deductions.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "3.4",
    "runs": [
     {
      "text": "If a payment is overdue by 1 week, you must pay 2 weeks’ rent in the following week; otherwise you must return the Vehicle, or TG CAR VIBES PTY LTD will take the Vehicle back. In that case the Bond will not be refunded, and you must pay a $350 penalty plus the Uber fee for the pick-up.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "3.5",
    "runs": [
     {
      "text": "Tolls: ",
      "bold": true
     },
     {
      "text": "Any toll charges incurred during the Rental Period will be added to your weekly rent and must be paid together with your next weekly payment. A $10 administration fee applies for processing toll charges.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "3.6",
    "runs": [
     {
      "text": "Fines: ",
      "bold": true
     },
     {
      "text": "All fines incurred during the Rental Period (including speeding, red-light, camera, parking, traffic and toll infringement notices) will be nominated to the driver of the Vehicle at the time of the offence. The driver is solely responsible for complying with each fine, including paying it and accepting any demerit points, and you agree to sign any nomination form we give you.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "3.7",
    "runs": [
     {
      "text": "Unpaid amounts: ",
      "bold": true
     },
     {
      "text": "If you do not pay any amount you owe under this Agreement when it is due, you must also pay the reasonable costs we incur in recovering it, including debt collection agency and legal costs.",
      "bold": false
     }
    ]
   }
  ]
 },
 {
  "title": "4. Drivers",
  "blocks": [
   {
    "type": "clause",
    "num": "4.1",
    "runs": [
     {
      "text": "Only Authorised Drivers may drive the Vehicle. If you want another person to drive, you must first give us their full name, licence details and contact details and obtain our written approval.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "4.2",
    "runs": [
     {
      "text": "You confirm that each Authorised Driver:",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(a)",
    "runs": [
     {
      "text": "is 21 years of age or older;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(b)",
    "runs": [
     {
      "text": "holds a current driver licence valid for driving in NSW; and",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(c)",
    "runs": [
     {
      "text": "has not had a licence cancelled or suspended in the last three years.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "4.3",
    "runs": [
     {
      "text": "You are responsible for the acts and omissions of anyone you allow to drive the Vehicle.",
      "bold": false
     }
    ]
   }
  ]
 },
 {
  "title": "5. Use of the Vehicle",
  "blocks": [
   {
    "type": "clause",
    "num": "5.1",
    "runs": [
     {
      "text": "You must not, and must not allow anyone else to:",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(a)",
    "runs": [
     {
      "text": "use the Vehicle for any illegal purpose, or for racing, rallies, contests or speed tests;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(b)",
    "runs": [
     {
      "text": "drive under the influence of alcohol or drugs, or with a blood alcohol level above the legal limit;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(c)",
    "runs": [
     {
      "text": "tow or push any vehicle, trailer or other object;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(d)",
    "runs": [
     {
      "text": "carry more passengers than there are seat belts, or a load heavier than the Vehicle is built for, or a load that is not properly secured;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(e)",
    "runs": [
     {
      "text": "carry flammable, explosive, corrosive or dangerous substances;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(f)",
    "runs": [
     {
      "text": "drive the Vehicle when it is damaged or unsafe, or after we have told you not to;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(g)",
    "runs": [
     {
      "text": "smoke or vape in the Vehicle, or carry animals or pets.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "5.2",
    "runs": [
     {
      "text": "Without our written permission you must not drive the Vehicle:",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(a)",
    "runs": [
     {
      "text": "more than 100 km from Bankstown Square NSW;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(b)",
    "runs": [
     {
      "text": "outside New South Wales; or",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(c)",
    "runs": [
     {
      "text": "onto any island off the Australian mainland.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "5.3",
    "runs": [
     {
      "text": "If you travel outside New South Wales without our permission, your Bond will not be refunded and you must pay a $1,000 penalty. We may also end this Agreement and recover the Vehicle.",
      "bold": false
     }
    ]
   }
  ]
 },
 {
  "title": "6. Maintenance and servicing",
  "blocks": [
   {
    "type": "clause",
    "num": "6.1",
    "runs": [
     {
      "text": "We are responsible for scheduled servicing and registration (including CTP green slip). You must bring the Vehicle for a service every 8,000 km or when we ask. We will give you at least 2 weeks’ notice of a service booking.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "6.2",
    "runs": [
     {
      "text": "You must check and keep the engine oil, coolant and tyre pressures at the correct levels, and tell us immediately about any warning light, fault or damage.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "6.3",
    "runs": [
     {
      "text": "You must not repair or modify the Vehicle, or have it repaired, without our prior approval.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "6.4",
    "runs": [
     {
      "text": "You must keep the Vehicle locked when unattended and keep the keys under your control at all times. If keys are lost, you must pay the cost of replacement.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "6.5",
    "runs": [
     {
      "text": "Fuel: the Vehicle uses petrol (see the Agreement Details for grade). You must pay for all fuel used.",
      "bold": false
     }
    ]
   }
  ]
 },
 {
  "title": "7. Insurance, damage and accidents",
  "blocks": [
   {
    "type": "clause",
    "num": "7.1",
    "runs": [
     {
      "text": "NO INSURANCE IS PROVIDED.",
      "bold": true
     },
     {
      "text": " The Vehicle is not covered by comprehensive or third-party property insurance under this Agreement. Only compulsory third party (CTP) cover for personal injury applies through registration.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "7.2",
    "runs": [
     {
      "text": "You are responsible for loss of or damage to the Vehicle during the Rental Period, other than fair wear and tear, including damage to tyres, wheels, lights, glass, panels and brakes. You must pay the cost of repair at market value, or if the Vehicle is written off or stolen and not recovered, the full market value of the Vehicle immediately before the loss.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "7.3",
    "runs": [
     {
      "text": "You are also responsible for any damage to other people’s property, and any claims by third parties, arising from your use of the Vehicle.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "7.4",
    "runs": [
     {
      "text": "If there is an accident, theft or damage, you must:",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(a)",
    "runs": [
     {
      "text": "make sure everyone is safe and call 000 if anyone is injured;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(b)",
    "runs": [
     {
      "text": "call us on 0451 688 698 as soon as possible;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(c)",
    "runs": [
     {
      "text": "get the other driver’s name, address, phone, licence, registration and insurer details;",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(d)",
    "runs": [
     {
      "text": "take photos of all vehicles and the scene, and report to police where required by law; and",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(e)",
    "runs": [
     {
      "text": "not admit liability to anyone.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "7.5",
    "runs": [
     {
      "text": "You must pay the cost of any repairs or loss under this clause 7 within 7 days after we give you the repairer’s quote or invoice. We may first deduct these amounts from the Bond, and you must pay any remaining balance.",
      "bold": false
     }
    ]
   },
   {
    "type": "insuranceAck"
   }
  ]
 },
 {
  "title": "8. Return of the Vehicle",
  "blocks": [
   {
    "type": "clause",
    "num": "8.1",
    "runs": [
     {
      "text": "You must return the Vehicle and keys to the location in the Agreement Details on the ending date, in the same condition as at pick-up (fair wear and tear excepted), with the same fuel level.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "8.2",
    "runs": [
     {
      "text": "The Vehicle must be returned clean inside and out. If it needs cleaning, a $60 cleaning fee applies.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "8.3",
    "runs": [
     {
      "text": "We will inspect the Vehicle with you at return, record its condition in writing with photos, and compare it with its condition at pick-up (including any photos taken at pick-up).",
      "bold": false
     }
    ]
   }
  ]
 },
 {
  "title": "9. Privacy",
  "blocks": [
   {
    "type": "clause",
    "num": "9.1",
    "runs": [
     {
      "text": "We collect your personal information (including your licence, identity documents and contact details) to verify your identity, manage this rental, process tolls and fines, and recover amounts owed. We store it securely and only disclose it where needed for these purposes (for example, to toll operators, Transport for NSW, police or our professional advisers) or where required by law.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "9.2",
    "runs": [
     {
      "text": "We will delete copies of your identity documents within 12 months after this Agreement ends, unless we need to keep them for a dispute or legal requirement.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "9.3",
    "runs": [
     {
      "text": "GPS tracking: ",
      "bold": true
     },
     {
      "text": "The Vehicle is fitted with a GPS tracking device. You consent to us collecting and using the Vehicle’s location data during the Rental Period to protect and recover the Vehicle, to check compliance with this Agreement, and to deal with accidents, theft, tolls and fines. You must not remove, disable or interfere with the device.",
      "bold": false
     }
    ]
   }
  ]
 },
 {
  "title": "10. Termination and recovery of the Vehicle",
  "blocks": [
   {
    "type": "clause",
    "num": "10.1",
    "runs": [
     {
      "text": "We may end this Agreement immediately by notice to you (including by SMS, WhatsApp or email) if you breach any term of this Agreement, if any information you gave us is false, or if the Vehicle is used in a way that puts it at risk.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "10.2",
    "runs": [
     {
      "text": "Termination by TG Car Vibes at any time: ",
      "bold": true
     },
     {
      "text": "TG CAR VIBES PTY LTD may end this Agreement at any time, for any reason, by giving you notice (including by SMS, WhatsApp or email). If we end this Agreement under this clause 10.2 while you are not in breach, clause 2.3 does not apply and we will refund the Bond, less any amounts you owe us under this Agreement.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "10.3",
    "runs": [
     {
      "text": "When this Agreement ends for any reason, you must return the Vehicle and keys immediately. If you do not, you authorise us, our employees and agents to enter any place where the Vehicle is kept (including your residential premises and driveway, but not inside your home) to recover the Vehicle, and to use a spare key to do so.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "10.4",
    "runs": [
     {
      "text": "You must pay the reasonable costs of recovering the Vehicle, together with any amounts owing under clauses 2.3, 3.4 and 5.3.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "10.5",
    "runs": [
     {
      "text": "Reporting the Vehicle as stolen: ",
      "bold": true
     },
     {
      "text": "We may report the Vehicle to police as stolen, and recover it under this clause 10, if:",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(a)",
    "runs": [
     {
      "text": "you do not pay rent when it is due and we cannot contact you within 24 hours; or",
      "bold": false
     }
    ]
   },
   {
    "type": "sub",
    "num": "(b)",
    "runs": [
     {
      "text": "the Vehicle is not returned by the ending date and return time, or when this Agreement ends for any other reason.",
      "bold": false
     }
    ]
   }
  ]
 },
 {
  "title": "11. General",
  "blocks": [
   {
    "type": "clause",
    "num": "11.1",
    "runs": [
     {
      "text": "You agree that this Agreement and any notices may be signed and given electronically.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "11.2",
    "runs": [
     {
      "text": "This Agreement is governed by the laws of New South Wales.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "11.3",
    "runs": [
     {
      "text": "Nothing in this Agreement excludes any rights you have under the Australian Consumer Law that cannot be excluded.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "11.4",
    "runs": [
     {
      "text": "Entire agreement: ",
      "bold": true
     },
     {
      "text": "This Agreement is the entire agreement between you and us about the rental of the Vehicle. Any change to it must be in writing (including by SMS, WhatsApp or email) and agreed by TG CAR VIBES PTY LTD. Verbal promises are not binding.",
      "bold": false
     }
    ]
   },
   {
    "type": "clause",
    "num": "11.5",
    "runs": [
     {
      "text": "Severability: ",
      "bold": true
     },
     {
      "text": "If any part of this Agreement is found to be invalid or unenforceable, that part will be read down or removed to the extent necessary, and the rest of this Agreement will continue in full force.",
      "bold": false
     }
    ]
   }
  ]
 }
];
