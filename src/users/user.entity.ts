import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from './enums/user-role.enum';
import { ClientAccountType } from './enums/client-account-type.enum';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column({ unique: true, nullable: true })
    googleId?: string;

    @Exclude()
    @Column({ nullable: true })
    password?: string;

    @Column({ type: 'enum', enum: UserRole })
    role: UserRole;

    @Column({ type: 'enum', enum: ClientAccountType, nullable: true })
    accountType?: ClientAccountType;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ nullable: true })
    verificationToken?: string;

    @Column({ nullable: true })
    resetPasswordToken?: string;

    @Column({ type: 'timestamp', nullable: true })
    resetPasswordExpires?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
