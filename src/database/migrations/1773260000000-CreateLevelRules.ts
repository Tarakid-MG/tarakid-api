import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLevelRules1773260000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`level_rules\` (
        \`id\` varchar(36) PRIMARY KEY,
        \`minAge\` int,
        \`maxAge\` int,
        \`englishReadingLevels\` text,
        \`englishSpeakingLevels\` text,
        \`operator\` varchar(10) DEFAULT 'AND',
        \`targetLevelCode\` varchar(20) NOT NULL,
        \`priority\` int DEFAULT 0
      ) ENGINE=InnoDB
    `);

    // Helper to escape values
    const seed = [
      // Age < 7
      {
        min: 0,
        max: 6,
        read: 'FLUENT',
        speak: 'FLUENT',
        op: 'AND',
        target: 'L2',
        prio: 10,
      },
      {
        min: 0,
        max: 6,
        read: 'FLUENT,SENTENCES',
        speak: 'FLUENT,SENTENCES',
        op: 'OR',
        target: 'L1',
        prio: 20,
      },
      {
        min: 0,
        max: 6,
        read: '',
        speak: '',
        op: 'AND',
        target: 'L0',
        prio: 30,
      },

      // Age 7-8
      {
        min: 7,
        max: 8,
        read: 'FLUENT',
        speak: 'FLUENT',
        op: 'AND',
        target: 'L3',
        prio: 40,
      },
      {
        min: 7,
        max: 8,
        read: 'FLUENT,SENTENCES',
        speak: 'FLUENT,SENTENCES',
        op: 'OR',
        target: 'L2',
        prio: 50,
      },
      {
        min: 7,
        max: 8,
        read: '',
        speak: '',
        op: 'AND',
        target: 'L1',
        prio: 60,
      },

      // Age 9-10
      {
        min: 9,
        max: 10,
        read: 'FLUENT',
        speak: 'FLUENT',
        op: 'AND',
        target: 'L4',
        prio: 70,
      },
      {
        min: 9,
        max: 10,
        read: 'FLUENT,SENTENCES',
        speak: 'FLUENT,SENTENCES',
        op: 'OR',
        target: 'L3',
        prio: 80,
      },
      {
        min: 9,
        max: 10,
        read: '',
        speak: '',
        op: 'AND',
        target: 'L1',
        prio: 90,
      },

      // Age 11-12
      {
        min: 11,
        max: 12,
        read: 'FLUENT',
        speak: 'FLUENT',
        op: 'AND',
        target: 'L4',
        prio: 100,
      },
      {
        min: 11,
        max: 12,
        read: 'FLUENT,SENTENCES',
        speak: 'FLUENT,SENTENCES',
        op: 'OR',
        target: 'L3',
        prio: 110,
      },
      {
        min: 11,
        max: 12,
        read: 'NONE',
        speak: '',
        op: 'OR',
        target: 'L1',
        prio: 120,
      },
      {
        min: 11,
        max: 12,
        read: '',
        speak: 'NONE',
        op: 'OR',
        target: 'L1',
        prio: 121,
      },
      {
        min: 11,
        max: 12,
        read: '',
        speak: '',
        op: 'AND',
        target: 'L2',
        prio: 130,
      },

      // Age 13-14
      {
        min: 13,
        max: 14,
        read: 'FLUENT',
        speak: 'FLUENT',
        op: 'AND',
        target: 'L4',
        prio: 140,
      },
      {
        min: 13,
        max: 14,
        read: 'FLUENT,SENTENCES,WORDS',
        speak: 'FLUENT,SENTENCES,WORDS',
        op: 'OR',
        target: 'L3',
        prio: 150,
      },
      {
        min: 13,
        max: 14,
        read: '',
        speak: '',
        op: 'AND',
        target: 'L2',
        prio: 160,
      },

      // Age 15+
      {
        min: 15,
        max: 100,
        read: 'FLUENT',
        speak: 'FLUENT',
        op: 'AND',
        target: 'L5',
        prio: 170,
      },
      {
        min: 15,
        max: 100,
        read: 'FLUENT,SENTENCES',
        speak: 'FLUENT,SENTENCES',
        op: 'OR',
        target: 'L4',
        prio: 180,
      },
      {
        min: 15,
        max: 100,
        read: 'WORDS',
        speak: 'WORDS',
        op: 'OR',
        target: 'L3',
        prio: 190,
      },
      {
        min: 15,
        max: 100,
        read: '',
        speak: '',
        op: 'AND',
        target: 'L2',
        prio: 200,
      },
    ];

    for (const r of seed) {
      await queryRunner.query(`
        INSERT INTO \`level_rules\` (\`id\`, \`minAge\`, \`maxAge\`, \`englishReadingLevels\`, \`englishSpeakingLevels\`, \`operator\`, \`targetLevelCode\`, \`priority\`)
        VALUES (UUID(), ${r.min}, ${r.max}, '${r.read}', '${r.speak}', '${r.op}', '${r.target}', ${r.prio})
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`level_rules\``);
  }
}
