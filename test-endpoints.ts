import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { BookingsService } from './src/bookings/bookings.service';

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const bookingsService = app.get(BookingsService);

  console.log('--- TEST: getAllBookedSlots ---');
  const slots = await bookingsService.getAllBookedSlots();
  console.log('Slots:', slots.slice(0, 3), slots.length > 3 ? '...' : '');

  if (slots.length > 0) {
    const slot = slots[0];
    console.log(
      `\n--- TEST: getAvailableTeachersForSlot (${slot.date} ${slot.time}) ---`,
    );
    const teachers = await bookingsService.getAvailableTeachersForSlot(
      slot.date,
      slot.time,
    );
    console.log(
      'Available Teachers:',
      teachers.map((t) => ({
        id: t.id,
        name: t.firstName,
        score: t.commitmentScore,
      })),
    );
  }

  await app.close();
}

test().catch(console.error);
